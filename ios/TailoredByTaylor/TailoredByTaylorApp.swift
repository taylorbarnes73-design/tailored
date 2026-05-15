import SwiftUI

@main
struct TailoredByTaylorApp: App {
    @State private var store = TailoredStore()

    var body: some Scene {
        WindowGroup {
            ContentView(store: store)
                .tintedTheme()
        }
    }
}

