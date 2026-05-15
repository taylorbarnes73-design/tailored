import Observation
import SwiftUI

struct ContentView: View {
    @Bindable var store: TailoredStore

    var body: some View {
        TabView(selection: $store.selectedTab) {
            NavigationStack {
                HomeView(store: store)
            }
            .tabItem {
                Label(AppTab.shop.title, systemImage: AppTab.shop.systemImage)
            }
            .tag(AppTab.shop)

            NavigationStack {
                StyleLabView(store: store)
            }
            .tabItem {
                Label(AppTab.styleLab.title, systemImage: AppTab.styleLab.systemImage)
            }
            .tag(AppTab.styleLab)

            NavigationStack {
                ProfileView(store: store)
            }
            .tabItem {
                Label(AppTab.profile.title, systemImage: AppTab.profile.systemImage)
            }
            .tag(AppTab.profile)
        }
        .background(Theme.background.ignoresSafeArea())
    }
}

private struct HomeView: View {
    @Bindable var store: TailoredStore

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                if let hero = store.heroRecommendation {
                    GlassCard {
                        VStack(alignment: .leading, spacing: 14) {
                            Text("Tailored by Taylor")
                                .font(.caption.weight(.bold))
                                .tracking(1.5)
                                .foregroundStyle(Theme.accent)

                            Text("Shop with the confidence of a private fitting.")
                                .font(.system(size: 34, weight: .medium, design: .serif))
                                .foregroundStyle(Theme.text)

                            Text("Smart-Fit preference logic, Studio Drops from IDM-VTON, and profile-based sizing all now live in a native SwiftUI shell.")
                                .font(.subheadline)
                                .foregroundStyle(Theme.secondaryText)

                            HStack {
                                MetricTile(title: "Average fit", value: "\(store.averageFit)%", tint: Theme.accent)
                                MetricTile(title: "Perfect fits", value: "\(store.perfectFitCount)", tint: Theme.success)
                            }

                            NavigationLink {
                                ItemDetailView(
                                    store: store,
                                    recommendation: hero,
                                    fitPreference: store.fitPreference
                                )
                            } label: {
                                HStack {
                                    VStack(alignment: .leading, spacing: 6) {
                                        Text("Current spotlight")
                                            .font(.caption.weight(.bold))
                                            .foregroundStyle(Theme.secondaryText)
                                        Text(hero.item.name)
                                            .font(.headline)
                                            .foregroundStyle(Theme.text)
                                        Text("Recommended size \(hero.bestSize)")
                                            .font(.subheadline)
                                            .foregroundStyle(Theme.accent)
                                    }
                                    Spacer()
                                    FitBadge(fit: hero.fit)
                                }
                                .padding(16)
                                .background(Theme.elevated, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }

                GlassCard {
                    VStack(alignment: .leading, spacing: 14) {
                        Text("Fit Preference")
                            .font(.headline)
                            .foregroundStyle(Theme.text)
                        PreferencePicker(selection: $store.fitPreference)
                    }
                }

                VStack(alignment: .leading, spacing: 14) {
                    Text("Recommended for you")
                        .font(.title3.weight(.bold))
                        .foregroundStyle(Theme.text)

                    ForEach(store.catalog.prefix(6)) { recommendation in
                        NavigationLink {
                            ItemDetailView(
                                store: store,
                                recommendation: recommendation,
                                fitPreference: store.fitPreference
                            )
                        } label: {
                            RecommendationRow(
                                recommendation: recommendation,
                                isFavorite: store.favoriteIDs.contains(recommendation.id),
                                onFavorite: { store.toggleFavorite(recommendation.id) }
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }

                if !store.studioRecommendations.isEmpty {
                    VStack(alignment: .leading, spacing: 14) {
                        HStack {
                            Text("Studio Drops")
                                .font(.title3.weight(.bold))
                                .foregroundStyle(Theme.text)
                            Spacer()
                            Text("Imported from IDM-VTON")
                                .font(.caption)
                                .foregroundStyle(Theme.secondaryText)
                        }

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 14) {
                                ForEach(store.studioRecommendations) { recommendation in
                                    NavigationLink {
                                        ItemDetailView(
                                            store: store,
                                            recommendation: recommendation,
                                            fitPreference: store.fitPreference
                                        )
                                    } label: {
                                        VStack(alignment: .leading, spacing: 12) {
                                            RoundedRectangle(cornerRadius: 24, style: .continuous)
                                                .fill(
                                                    LinearGradient(
                                                        colors: [recommendation.item.accentColor.opacity(0.95), Theme.accentMuted.opacity(0.76)],
                                                        startPoint: .topLeading,
                                                        endPoint: .bottomTrailing
                                                    )
                                                )
                                                .overlay(
                                                    Image(systemName: recommendation.item.symbolName)
                                                        .font(.system(size: 28, weight: .medium))
                                                        .foregroundStyle(.white.opacity(0.85))
                                                )
                                                .frame(width: 180, height: 180)

                                            Text(recommendation.item.name)
                                                .font(.headline)
                                                .foregroundStyle(Theme.text)
                                                .lineLimit(2)
                                            Text("Size \(recommendation.bestSize) • \(recommendation.fit)% fit")
                                                .font(.caption)
                                                .foregroundStyle(Theme.secondaryText)
                                        }
                                        .frame(width: 180, alignment: .leading)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    }
                }
            }
            .padding(20)
        }
        .background(Theme.background.ignoresSafeArea())
        .navigationTitle("Tailored")
    }
}

private struct StyleLabView: View {
    @Bindable var store: TailoredStore

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                GlassCard {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Style Lab")
                            .font(.system(size: 30, weight: .medium, design: .serif))
                            .foregroundStyle(Theme.text)
                        Text("The native app keeps the strongest imported ideas: Smart-Fit preference bias, IDM-VTON studio inventory, and catalog-ingestion readiness.")
                            .font(.subheadline)
                            .foregroundStyle(Theme.secondaryText)
                        PreferencePicker(selection: $store.fitPreference)
                    }
                }

                ForEach(store.styleLabCapabilities) { capability in
                    GlassCard {
                        HStack(alignment: .top, spacing: 14) {
                            Image(systemName: capability.symbol)
                                .font(.system(size: 20, weight: .bold))
                                .foregroundStyle(capability.tint)
                                .frame(width: 38, height: 38)
                                .background(capability.tint.opacity(0.12), in: RoundedRectangle(cornerRadius: 12, style: .continuous))

                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    Text(capability.title)
                                        .font(.headline)
                                        .foregroundStyle(Theme.text)
                                    Spacer()
                                    Text(capability.status)
                                        .font(.caption.weight(.bold))
                                        .foregroundStyle(capability.tint)
                                }
                                Text(capability.message)
                                    .font(.subheadline)
                                    .foregroundStyle(Theme.secondaryText)
                            }
                        }
                    }
                }

                GlassCard {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("What Ships First")
                            .font(.headline)
                            .foregroundStyle(Theme.text)
                        Text("1. Native shopping and fit intelligence")
                            .foregroundStyle(Theme.text)
                        Text("2. Studio Drops and preference-aware sizing")
                            .foregroundStyle(Theme.text)
                        Text("3. Body scan and image try-on once the iOS app is connected to the Python services behind the existing web app")
                            .foregroundStyle(Theme.secondaryText)
                    }
                }
            }
            .padding(20)
        }
        .background(Theme.background.ignoresSafeArea())
        .navigationTitle("Style Lab")
    }
}

private struct ProfileView: View {
    @Bindable var store: TailoredStore

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                GlassCard {
                    VStack(alignment: .leading, spacing: 14) {
                        Text("Your Fit Identity")
                            .font(.system(size: 30, weight: .medium, design: .serif))
                            .foregroundStyle(Theme.text)

                        HStack {
                            MetricTile(title: "Bust", value: "\(store.bodyProfile.bust, specifier: "%.1f") in", tint: Theme.accent)
                            MetricTile(title: "Waist", value: "\(store.bodyProfile.waist, specifier: "%.1f") in", tint: Theme.accent)
                            MetricTile(title: "Hips", value: "\(store.bodyProfile.hips, specifier: "%.1f") in", tint: Theme.accent)
                        }

                        PreferencePicker(selection: $store.fitPreference)
                    }
                }

                GlassCard {
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Adjust Measurements")
                            .font(.headline)
                            .foregroundStyle(Theme.text)

                        ProfileSliderRow(title: "Bust", value: $store.bodyProfile.bust, range: 28...52)
                        ProfileSliderRow(title: "Waist", value: $store.bodyProfile.waist, range: 20...44)
                        ProfileSliderRow(title: "Hips", value: $store.bodyProfile.hips, range: 30...56)
                        ProfileSliderRow(title: "Inseam", value: $store.bodyProfile.inseam, range: 24...36)
                        ProfileSliderRow(title: "Shoulder", value: $store.bodyProfile.shoulder, range: 12...20)
                    }
                }

                GlassCard {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Current Stats")
                            .font(.headline)
                            .foregroundStyle(Theme.text)
                        HStack {
                            MetricTile(title: "Average fit", value: "\(store.averageFit)%", tint: Theme.accent)
                            MetricTile(title: "Favorites", value: "\(store.favoriteRecommendations.count)", tint: Theme.success)
                        }
                        HStack {
                            MetricTile(title: "Perfect fits", value: "\(store.perfectFitCount)", tint: Theme.success)
                            MetricTile(title: "Low risk", value: "\(store.lowRiskCount)", tint: Theme.warning)
                        }
                    }
                }

                if !store.favoriteRecommendations.isEmpty {
                    VStack(alignment: .leading, spacing: 14) {
                        Text("Saved Pieces")
                            .font(.title3.weight(.bold))
                            .foregroundStyle(Theme.text)

                        ForEach(store.favoriteRecommendations) { recommendation in
                            NavigationLink {
                                ItemDetailView(
                                    store: store,
                                    recommendation: recommendation,
                                    fitPreference: store.fitPreference
                                )
                            } label: {
                                RecommendationRow(
                                    recommendation: recommendation,
                                    isFavorite: true,
                                    onFavorite: { store.toggleFavorite(recommendation.id) }
                                )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
            .padding(20)
        }
        .background(Theme.background.ignoresSafeArea())
        .navigationTitle("Profile")
    }
}

#Preview {
    ContentView(store: TailoredStore())
        .tintedTheme()
}
