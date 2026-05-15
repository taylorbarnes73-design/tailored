import SwiftUI

enum AppTab: String, CaseIterable, Identifiable {
    case shop
    case styleLab
    case profile

    var id: String { rawValue }

    var title: String {
        switch self {
        case .shop: "Shop"
        case .styleLab: "Style Lab"
        case .profile: "Profile"
        }
    }

    var systemImage: String {
        switch self {
        case .shop: "bag"
        case .styleLab: "sparkles"
        case .profile: "person"
        }
    }
}

enum FitPreference: String, CaseIterable, Identifiable {
    case slim
    case regular
    case relaxed

    var id: String { rawValue }

    var title: String {
        switch self {
        case .slim: "Slim"
        case .regular: "Regular"
        case .relaxed: "Relaxed"
        }
    }

    var explanation: String {
        switch self {
        case .slim: "Closer, sharper fit"
        case .regular: "Balanced everyday ease"
        case .relaxed: "More room and comfort"
        }
    }
}

enum RiskLevel: String, CaseIterable {
    case low = "Low"
    case medium = "Medium"
    case high = "High"

    var color: Color {
        switch self {
        case .low: Theme.success
        case .medium: Theme.warning
        case .high: Theme.danger
        }
    }
}

enum CatalogSource: String {
    case main = "Tailored"
    case studio = "Studio Drop"
}

struct BodyProfile: Hashable {
    var bust: Double
    var waist: Double
    var hips: Double
    var inseam: Double
    var shoulder: Double

    static let preview = BodyProfile(bust: 34, waist: 26, hips: 36, inseam: 30, shoulder: 15)
}

struct CatalogItem: Identifiable, Hashable {
    let id: String
    let name: String
    let brand: String
    let category: String
    let price: Double
    let measurements: [String: String]
    let sizingNote: String
    let fabric: String
    let accentHex: String
    let badge: String?
    let source: CatalogSource
    let summary: String
    let productURL: String?

    var accentColor: Color { Color(hex: accentHex) }

    var symbolName: String {
        switch category {
        case "Tops": "tshirt"
        case "Bottoms": "figure.walk.motion"
        case "Dresses": "sparkles"
        case "Outerwear": "wind"
        default: "hanger"
        }
    }
}

struct CatalogRecommendation: Identifiable, Hashable {
    let item: CatalogItem
    let fit: Int
    let bestSize: String
    let alternateSize: String?
    let confidence: Int
    let risk: RiskLevel
    let fitReason: String
    let riskReason: String

    var id: String { item.id }
}

struct StyleLabCapability: Identifiable, Hashable {
    let id: String
    let title: String
    let status: String
    let message: String
    let symbol: String
    let tint: Color
}

enum Theme {
    static let background = Color(hex: "#0B0908")
    static let surface = Color(hex: "#171311")
    static let elevated = Color(hex: "#221b18")
    static let border = Color.white.opacity(0.08)
    static let text = Color(hex: "#F6F1EB")
    static let secondaryText = Color(hex: "#A99C93")
    static let accent = Color(hex: "#C8A36D")
    static let accentMuted = Color(hex: "#7E5F45")
    static let success = Color(hex: "#61CF94")
    static let warning = Color(hex: "#F0BC59")
    static let danger = Color(hex: "#F28A83")
}

extension View {
    func tintedTheme() -> some View {
        preferredColorScheme(.dark)
            .background(Theme.background)
            .tint(Theme.accent)
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

