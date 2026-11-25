#!/usr/bin/env python3
"""
Gera o pacote de instalação do TaxiCampos para hospedagem PHP (InfinityFree, Hostinger...).

Saída em dist/:
  - taxicampos-site.zip  → todos os arquivos do site
  - instalar.php         → instalador com um código (token) novo e aleatório

Uso:  python3 ferramentas/empacotar.py
Depois envie os DOIS arquivos para a pasta htdocs e abra
https://SEU-SITE/instalar.php?token=<token mostrado no fim>.
"""
import os, secrets, sys, zipfile, pathlib

RAIZ = pathlib.Path(__file__).resolve().parent.parent
DIST = RAIZ / "dist"
FORA = {".git", "dist", "ferramentas", "README.md", "instalar.php", ".gitignore", "inc/config.php"}

def incluir(rel: str) -> bool:
    partes = rel.split("/")
    if partes[0] in FORA or rel in FORA:
        return False
    if any(p.startswith(".") and p not in (".htaccess",) for p in partes):
        return False
    if rel.endswith(".gitkeep"):
        return False
    return True

def main():
    DIST.mkdir(exist_ok=True)
    zip_path = DIST / "taxicampos-site.zip"
    n = 0
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        for caminho in sorted(RAIZ.rglob("*")):
            if caminho.is_dir():
                continue
            rel = caminho.relative_to(RAIZ).as_posix()
            if incluir(rel):
                z.write(caminho, rel)
                n += 1
        # pastas vazias que o site usa (fotos enviadas pelo painel)
        for pasta in ("fotos/", "apoiadores/"):
            z.writestr(pasta, "")

    token = secrets.token_urlsafe(24)
    instalador = (RAIZ / "instalar.php").read_text(encoding="utf-8")
    marca = "const TOKEN_INSTALACAO = '__TOKEN_INSTALACAO__';"
    if marca not in instalador:
        sys.exit("Não achei a linha do token em instalar.php")
    (DIST / "instalar.php").write_text(
        instalador.replace(marca, f"const TOKEN_INSTALACAO = '{token}';"), encoding="utf-8")

    print(f"{n} arquivos em {zip_path.relative_to(RAIZ)} ({zip_path.stat().st_size // 1024} KB)")
    print(f"Instalador: {(DIST / 'instalar.php').relative_to(RAIZ)}")
    print(f"TOKEN={token}")

if __name__ == "__main__":
    main()
