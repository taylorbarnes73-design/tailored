import SwiftUI

struct GlassCard<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        content
            .padding(18)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .fill(Theme.surface.opacity(0.98))
                    .overlay(
                        RoundedRectangle(cornerRadius: 24, style: .continuous)
                            .stroke(Theme.border, lineWidth: 1)
                    )
            )
    }
}

struct FitBadge: View {
    let fit: Int

    var tint: Color {
        if fit >= 90 { return Theme.success }
        if fit >= 75 { return Theme.warning }
        return Theme.danger
    }

    var body: some View {
        Text("\(fit)% fit")
            .font(.caption.weight(.bold))
            .foregroundStyle(tint)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(tint.opacity(0.12), in: Capsule())
    }
}

struct PreferencePicker: View {
    @Binding var selection: FitPreference

    var body: some View {
        HStack(spacing: 8) {
            ForEach(FitPreference.allCases) { preference in
                Button {
                    selection = preference
                } label: {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(preference.title)
                            .font(.subheadline.weight(.semibold))
                        Text(preference.explanation)
                            .font(.caption2)
                            .foregroundStyle(Theme.secondaryText)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(12)
                    .background(
                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .fill(selection == preference ? Theme.accent.opacity(0.18) : Theme.elevated)
                            .overlay(
                                RoundedRectangle(cornerRadius: 18, style: .continuous)
                                    .stroke(selection == preference ? Theme.accent.opacity(0.4) : Theme.border, lineWidth: 1)
                            )
                    )
                }
                .buttonStyle(.plain)
            }
        }
    }
}

struct MetricTile: View {
    let title: String
    let value: String
    let tint: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.caption)
                .foregroundStyle(Theme.secondaryText)
            Text(value)
                .font(.title3.weight(.bold))
                .foregroundStyle(tint)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(Theme.elevated)
                .overlay(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .stroke(Theme.border, lineWidth: 1)
                )
        )
    }
}

struct RecommendationRow: View {
    let recommendation: CatalogRecommendation
    let isFavorite: Bool
    let onFavorite: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [recommendation.item.accentColor.opacity(0.95), Theme.accentMuted.opacity(0.8)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay(
                    Image(systemName: recommendation.item.symbolName)
                        .font(.system(size: 26, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.85))
                )
                .frame(width: 78, height: 98)

            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(recommendation.item.brand.uppercased())
                            .font(.caption2.weight(.bold))
                            .tracking(1.2)
                            .foregroundStyle(Theme.secondaryText)
                        Text(recommendation.item.name)
                            .font(.headline)
                            .foregroundStyle(Theme.text)
                        Text(recommendation.item.summary)
                            .font(.caption)
                            .foregroundStyle(Theme.secondaryText)
                            .lineLimit(2)
                    }
                    Spacer()
                    Button(action: onFavorite) {
                        Image(systemName: isFavorite ? "heart.fill" : "heart")
                            .foregroundStyle(isFavorite ? Theme.accent : Theme.secondaryText)
                            .padding(8)
                            .background(Theme.elevated, in: Circle())
                    }
                    .buttonStyle(.plain)
                }

                HStack {
                    Text("$\(recommendation.item.price, format: .number.precision(.fractionLength(2)))")
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(Theme.text)
                    Spacer()
                    Text("Size \(recommendation.bestSize)")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(Theme.secondaryText)
                    FitBadge(fit: recommendation.fit)
                }
            }
        }
    }
}

struct ProfileSliderRow: View {
    let title: String
    @Binding var value: Double
    let range: ClosedRange<Double>

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Theme.text)
                Spacer()
                Text("\(value, specifier: "%.1f") in")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(Theme.accent)
            }

            Slider(value: $value, in: range, step: 0.5)
                .tint(Theme.accent)
        }
    }
}

