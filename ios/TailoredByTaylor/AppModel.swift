import Foundation
import Observation

@Observable
@MainActor
final class TailoredStore {
    var selectedTab: AppTab = .shop
    var fitPreference: FitPreference = .regular
    var bodyProfile: BodyProfile = .preview
    var favoriteIDs: Set<String> = ["zara-trench", "studio-shirt"]

    var catalog: [CatalogRecommendation] {
        SampleData.items
            .map { evaluate(item: $0, profile: bodyProfile, preference: fitPreference) }
            .sorted { lhs, rhs in
                if lhs.fit == rhs.fit {
                    return lhs.item.price < rhs.item.price
                }
                return lhs.fit > rhs.fit
            }
    }

    var heroRecommendation: CatalogRecommendation? {
        catalog.first
    }

    var favoriteRecommendations: [CatalogRecommendation] {
        catalog.filter { favoriteIDs.contains($0.id) }
    }

    var studioRecommendations: [CatalogRecommendation] {
        catalog.filter { $0.item.source == .studio }
    }

    var averageFit: Int {
        guard !catalog.isEmpty else { return 0 }
        return Int(catalog.map(\.fit).reduce(0, +) / catalog.count)
    }

    var perfectFitCount: Int {
        catalog.filter { $0.fit >= 90 }.count
    }

    var lowRiskCount: Int {
        catalog.filter { $0.risk == .low }.count
    }

    var styleLabCapabilities: [StyleLabCapability] {
        [
            StyleLabCapability(
                id: "smart-fit",
                title: "Smart-Fit Logic",
                status: "Integrated",
                message: "Fit preference, explainability, and return-risk guidance now shape every recommendation.",
                symbol: "dial.high",
                tint: Theme.success
            ),
            StyleLabCapability(
                id: "idm-vton",
                title: "IDM-VTON Studio",
                status: "Catalog Live",
                message: "Starter products from the IDM-VTON repo are already surfaced as Studio Drops while the heavy runtime remains a future upgrade.",
                symbol: "cube.transparent",
                tint: Theme.accent
            ),
            StyleLabCapability(
                id: "scraper",
                title: "Scraper Feed",
                status: "Schema Ready",
                message: "The imported scraper layout can support future catalog ingestion once the feed points at fashion sources.",
                symbol: "tray.and.arrow.down",
                tint: Theme.warning
            ),
        ]
    }

    func toggleFavorite(_ itemID: String) {
        if favoriteIDs.contains(itemID) {
            favoriteIDs.remove(itemID)
        } else {
            favoriteIDs.insert(itemID)
        }
    }

    private func evaluate(item: CatalogItem, profile: BodyProfile, preference: FitPreference) -> CatalogRecommendation {
        let orderedSizes = item.measurements.keys.sorted(by: compareSizes)
        let scoredSizes = orderedSizes.map { size in
            (size: size, score: fitScore(profile: profile, measurementString: item.measurements[size] ?? "", category: item.category))
        }

        guard let best = scoredSizes.max(by: { $0.score < $1.score }) else {
            return CatalogRecommendation(
                item: item,
                fit: 80,
                bestSize: "M",
                alternateSize: nil,
                confidence: 75,
                risk: .medium,
                fitReason: "No size data was available, so this result falls back to a neutral recommendation.",
                riskReason: "Medium risk because this item does not yet have a complete size map."
            )
        }

        let bestIndex = scoredSizes.firstIndex(where: { $0.size == best.size }) ?? 0
        let direction = switch preference {
        case .slim: -1
        case .regular: 0
        case .relaxed: 1
        }

        let candidateIndex = bestIndex + direction
        let chosen: (size: String, score: Int)
        if direction != 0,
           scoredSizes.indices.contains(candidateIndex),
           scoredSizes[candidateIndex].score >= best.score - 6,
           scoredSizes[candidateIndex].score >= 72 {
            chosen = scoredSizes[candidateIndex]
        } else {
            chosen = best
        }

        let alternate = scoredSizes
            .sorted(by: { $0.score > $1.score })
            .first(where: { $0.size != chosen.size })

        let adjustedFit = clamp(chosen.score + preferenceBonus(for: item, preference: preference), min: 55, max: 99)
        let confidencePenalty: Int
        if let alternate {
            let gap = abs(chosen.score - alternate.score)
            confidencePenalty = gap <= 3 ? 7 : gap <= 6 ? 3 : 0
        } else {
            confidencePenalty = 0
        }

        let confidence = clamp(adjustedFit + 4 - confidencePenalty, min: 58, max: 99)
        let risk: RiskLevel = adjustedFit >= 92 && confidence >= 86 ? .low : adjustedFit >= 80 ? .medium : .high

        return CatalogRecommendation(
            item: item,
            fit: adjustedFit,
            bestSize: chosen.size,
            alternateSize: alternate?.size,
            confidence: confidence,
            risk: risk,
            fitReason: fitReason(item: item, profile: profile, preference: preference, bestSize: chosen.size, fit: adjustedFit),
            riskReason: riskReason(item: item, risk: risk, preference: preference, alternateSize: alternate?.size)
        )
    }

    private func preferenceBonus(for item: CatalogItem, preference: FitPreference) -> Int {
        let note = "\(item.sizingNote) \(item.fabric)".lowercased()

        switch preference {
        case .slim:
            if note.contains("slim") || note.contains("structured") || note.contains("tailored") { return 4 }
            if note.contains("relaxed") || note.contains("wide-leg") || note.contains("comfort") { return -5 }
        case .regular:
            if note.contains("true to size") { return 2 }
        case .relaxed:
            if note.contains("relaxed") || note.contains("comfort") || note.contains("wide-leg") { return 4 }
            if note.contains("slim") || note.contains("structured") { return -4 }
        }

        return 0
    }

    private func fitReason(item: CatalogItem, profile: BodyProfile, preference: FitPreference, bestSize: String, fit: Int) -> String {
        if fit >= 94 {
            return "Your \(Int(profile.bust))-\(Int(profile.waist))-\(Int(profile.hips)) profile lands right in the sweet spot for \(item.brand)’s \(bestSize). It supports a \(preference.title.lowercased()) fit goal without compromising shape."
        }
        if fit >= 86 {
            return "\(item.brand)’s cut works well for your proportions in \(bestSize). The \(preference.title.lowercased()) preference mainly decides how close or easy the final silhouette feels."
        }
        return "This is wearable in \(bestSize), but the proportions are not perfect. Keep tailoring in mind if you want this piece to fully match your \(preference.title.lowercased()) preference."
    }

    private func riskReason(item: CatalogItem, risk: RiskLevel, preference: FitPreference, alternateSize: String?) -> String {
        switch risk {
        case .low:
            return "Low risk because the recommendation stays stable across key measurement checks and still matches your \(preference.title.lowercased()) preference."
        case .medium:
            if let alternateSize {
                return "Medium risk because \(item.brand)’s size map is close between \(alternateSize) and the recommended size, so preference is acting as the tie-break."
            }
            return "Medium risk because one area is slightly off even though the overall silhouette still works."
        case .high:
            return "High risk because at least one major measurement falls outside the ideal range. This is a better tailoring candidate than a blind buy."
        }
    }
}

private func parseMeasurements(_ value: String) -> [String: (min: Double, max: Double)] {
    value
        .replacingOccurrences(of: "in", with: "")
        .split(separator: ",")
        .reduce(into: [String: (min: Double, max: Double)]()) { partialResult, part in
            let trimmed = part.trimmingCharacters(in: .whitespaces)
            let pieces = trimmed.split(separator: " ")
            guard pieces.count >= 2 else { return }

            let key = pieces[0].lowercased()
            let values = pieces[1].split(separator: "-")

            guard let first = Double(values[0]) else { return }
            let second = values.count > 1 ? Double(values[1]) ?? first : first
            partialResult[key] = (min: first, max: second)
        }
}

private func fitScore(profile: BodyProfile, measurementString: String, category: String) -> Int {
    let measurements = parseMeasurements(measurementString)

    let weights: [String: Double]
    switch category {
    case "Tops":
        weights = ["bust": 0.55, "waist": 0.30, "shoulder": 0.15]
    case "Bottoms":
        weights = ["waist": 0.45, "hip": 0.35, "inseam": 0.20]
    case "Dresses":
        weights = ["bust": 0.30, "waist": 0.35, "hip": 0.35]
    case "Outerwear":
        weights = ["bust": 0.50, "waist": 0.30, "shoulder": 0.20]
    default:
        weights = ["bust": 0.55, "waist": 0.30, "shoulder": 0.15]
    }

    let bodyMap: [String: Double] = [
        "bust": profile.bust,
        "chest": profile.bust,
        "waist": profile.waist,
        "hip": profile.hips,
        "inseam": profile.inseam,
        "shoulder": profile.shoulder,
    ]

    var totalWeight = 0.0
    var weightedScore = 0.0

    for (key, range) in measurements {
        guard let bodyValue = bodyMap[key] else { continue }
        let weight = weights[key] ?? 0.05
        let score: Double
        if bodyValue >= range.min && bodyValue <= range.max {
            score = 100
        } else if bodyValue < range.min {
            score = max(50, 100 - ((range.min - bodyValue) * 10))
        } else {
            score = max(50, 100 - ((bodyValue - range.max) * 10))
        }

        totalWeight += weight
        weightedScore += score * weight
    }

    guard totalWeight > 0 else { return 88 }
    return clamp(Int((weightedScore / totalWeight).rounded()), min: 55, max: 99)
}

func compareSizes(_ lhs: String, _ rhs: String) -> Bool {
    let sizeOrder = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"]

    if let leftNumber = Double(lhs), let rightNumber = Double(rhs) {
        return leftNumber < rightNumber
    }

    if let leftIndex = sizeOrder.firstIndex(of: lhs.uppercased()),
       let rightIndex = sizeOrder.firstIndex(of: rhs.uppercased()) {
        return leftIndex < rightIndex
    }

    return lhs.localizedStandardCompare(rhs) == .orderedAscending
}

func clamp(_ value: Int, min: Int, max: Int) -> Int {
    Swift.max(min, Swift.min(max, value))
}
