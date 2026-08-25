# Release v1.0.0

## GitHub-Release erzeugen

1. https://github.com/redshoxx/kochzettel/actions
2. Workflow **Release erstellen**
3. **Run workflow**, Tag `v1.0.0`

Danach liegt das Release unter https://github.com/redshoxx/kochzettel/releases

## SideStore

1. `Kochzettel.ipa` auf dem Mac bauen (Bundle-ID `de.kochzettel.app`)
2. Im Release `v1.0.0` als Asset hochladen
3. Workflow **SideStore Quelle aktualisieren** laufen lassen

Quelle:
https://raw.githubusercontent.com/redshoxx/kochzettel/main/sidestore/apps.json
