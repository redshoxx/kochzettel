#!/usr/bin/env python3
import json
import os
import pathlib
import subprocess
import sys


def gh_json(args):
    out = subprocess.check_output(["gh", *args], text=True)
    return json.loads(out)


def main():
    repo = os.environ["GITHUB_REPOSITORY"]
    tag = os.environ.get("GITHUB_REF_NAME") or ""
    if not tag or tag == "main":
        releases = gh_json(["release", "list", "--limit", "1", "--json", "tagName"])
        if not releases:
            sys.exit("Kein Release gefunden")
        tag = releases[0]["tagName"]

    version = tag[1:] if tag.startswith("v") else tag
    data = gh_json(["api", f"repos/{repo}/releases/tags/{tag}"])
    ipa = next((a for a in data.get("assets", []) if a.get("name", "").lower().endswith(".ipa")), None)
    if not ipa:
        sys.exit("Keine .ipa im Release. Lade Kochzettel.ipa als Asset hoch.")

    notes = data.get("body") or f"Version {version}"
    date = (data.get("published_at") or "")[:10]
    url = ipa["browser_download_url"]
    size = int(ipa["size"])

    path = pathlib.Path("sidestore/apps.json")
    source = json.loads(path.read_text())
    app = source["apps"][0]
    entry = {
        "version": version,
        "date": date,
        "localizedDescription": notes[:2000],
        "downloadURL": url,
        "size": size,
        "minOSVersion": "15.0",
    }
    app["versions"] = [entry] + [v for v in app.get("versions", []) if v.get("version") != version]
    app["version"] = version
    app["versionDate"] = date
    app["downloadURL"] = url
    app["size"] = size
    news = {
        "title": f"Kochzettel {version}",
        "identifier": f"kochzettel-{version}",
        "caption": notes.split("\n")[0][:120],
        "date": date,
        "tintColor": "7D9A72",
        "notify": True,
        "appID": "de.kochzettel.app",
    }
    source["news"] = [news] + [n for n in source.get("news", []) if n.get("identifier") != news["identifier"]]
    source["sourceURL"] = f"https://raw.githubusercontent.com/{repo}/main/sidestore/apps.json"
    source["website"] = f"https://github.com/{repo}"
    path.write_text(json.dumps(source, indent=2, ensure_ascii=False) + "\n")
    print(f"updated {version} {url} {size}")


if __name__ == "__main__":
    main()
