# Kochzettel in SideStore + GitHub-Updates

## Quelle in SideStore hinzufügen

1. SideStore auf dem iPhone öffnen.
2. Tab **Quellen** → **+**.
3. Diese URL einfügen:

```
https://raw.githubusercontent.com/redshoxx/kochzettel/main/sidestore/apps.json
```

Oder per Link:

```
sidestore://source?url=https://raw.githubusercontent.com/redshoxx/kochzettel/main/sidestore/apps.json
```

4. App **Kochzettel** installieren.
5. SideStore erneuert die Signatur selbst (**Refresh**).

## Automatische Updates

1. `Kochzettel.ipa` bauen.
2. GitHub → Releases → Draft a new release.
3. Tag z. B. `v1.0.1`, Datei `Kochzettel.ipa` anhängen, veröffentlichen.
4. Der Workflow aktualisiert `sidestore/apps.json`.
5. SideStore zeigt **Update**.

## IPA bauen (Mac + Xcode)

Bundle ID: `de.kochzettel.app`
