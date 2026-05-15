import Observation
import SwiftUI

struct ItemDetailView: View {
    @Bindable var store: TailoredStore
    let recommendation: CatalogRecommendation
    let fitPreference: FitPreference

    private var isFavorite: Bool {
        store.favoriteIDs.contains(recommendation.id)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                RoundedRectangle(cornerRadius: 30, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [recommendation.item.accentColor.opacity(0.95), Theme.accentMuted.opacity(0.82), Theme.background],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .overlay(alignment: .topTrailing) {
                        Button {
                            store.toggleFavorite(recommendation.id)
                        } label: {
                            Image(systemName: isFavorite ? "heart.fill" : "heart")
                                .foregroundStyle(isFavorite ? Theme.accent : .white.opacity(0.85))
                                .padding(12)
                                .background(.black.opacity(0.16), in: Circle())
                        }
                        .buttonStyle(.plain)
                        .padding(16)
                    }
                    .overlay {
                        VStack(spacing: 14) {
                            Image(systemName: recommendation.item.symbolName)
                                .font(.system(size: 44, weight: .regular))
                                .foregroundStyle(.white.opacity(0.86))
                            Text(recommendation.item.source.rawValue)
                                .font(.caption.weight(.bold))
                                .padding(.horizontal, 10)
                                .padding(.vertical, 6)
                                .background(.white.opacity(0.12), in: Capsule())
                        }
                    }
                    .frame(height: 300)

                VStack(alignment: .leading, spacing: 8) {
                    Text(recommendation.item.brand.uppercased())
                        .font(.caption.weight(.bold))
                        .tracking(1.3)
                        .foregroundStyle(Theme.accent)
                    Text(recommendation.item.name)
                        .font(.system(size: 30, weight: .medium, design: .serif))
                        .foregroundStyle(Theme.text)
                    HStack {
                        Text("$\(recommendation.item.price, format: .number.precision(.fractionLength(2)))")
                            .font(.title2.weight(.bold))
                        FitBadge(fit: recommendation.fit)
                    }
                    .foregroundStyle(Theme.text)
                }

                GlassCard {
                    VStack(alignment: .leading, spacing: 14) {
                        Text("Fit Intelligence")
                            .font(.headline)
                            .foregroundStyle(Theme.text)

                        HStack {
                            MetricTile(title: "Recommended", value: recommendation.bestSize, tint: Theme.accent)
                            MetricTile(title: "Confidence", value: "\(recommendation.confidence)%", tint: recommendation.risk.color)
                            MetricTile(title: "Risk", value: recommendation.risk.rawValue, tint: recommendation.risk.color)
                        }

                        if let alternateSize = recommendation.alternateSize {
                            Text("Backup size: \(alternateSize)")
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(Theme.secondaryText)
                        }

                        VStack(alignment: .leading, spacing: 10) {
                            Text(recommendation.fitReason)
                                .font(.subheadline)
                                .foregroundStyle(Theme.text)
                            Text(recommendation.riskReason)
                                .font(.footnote)
                                .foregroundStyle(recommendation.risk.color)
                            Text("Fit preference: \(fitPreference.title) • \(fitPreference.explanation)")
                                .font(.footnote)
                                .foregroundStyle(Theme.secondaryText)
                        }
                    }
                }

                GlassCard {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Size Map")
                            .font(.headline)
                            .foregroundStyle(Theme.text)

                        ForEach(recommendation.item.measurements.keys.sorted(by: compareSizes), id: \.self) { size in
                            HStack(alignment: .top) {
                                Text(size)
                                    .font(.subheadline.weight(.bold))
                                    .foregroundStyle(size == recommendation.bestSize ? Theme.accent : Theme.text)
                                    .frame(width: 54, alignment: .leading)
                                Text(recommendation.item.measurements[size] ?? "")
                                    .font(.footnote)
                                    .foregroundStyle(Theme.secondaryText)
                                Spacer()
                            }
                            .padding(.vertical, 4)
                        }
                    }
                }

                GlassCard {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Material & Notes")
                            .font(.headline)
                            .foregroundStyle(Theme.text)
                        Text(recommendation.item.fabric)
                            .font(.subheadline)
                            .foregroundStyle(Theme.text)
                        Text(recommendation.item.sizingNote)
                            .font(.footnote)
                            .foregroundStyle(Theme.secondaryText)
                    }
                }
            }
            .padding(20)
        }
        .background(Theme.background.ignoresSafeArea())
        .navigationTitle("Fit Detail")
        .navigationBarTitleDisplayMode(.inline)
    }
}
