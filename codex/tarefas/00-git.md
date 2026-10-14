# Tarefa 00 — Versionamento com git (manual, sem Codex)

**Objetivo:** ter um ponto de restauração antes de qualquer mudança, para revisar cada fragmento
do Codex como um diff e desfazer com um comando.

Na pasta do projeto:
```
git init
git add -A
git commit -m "Estado inicial (v14)"
```

Opcional, para não versionar arquivos pesados de trabalho, crie `.gitignore` **antes** do `git add`:
```
Microsoft/
preview_*.png
cafe_h_*.png
dev_room_*.png
```
(Os arquivos continuam na pasta; apenas não entram no histórico.)

**Aceite:** `git status` mostra "nothing to commit, working tree clean".
