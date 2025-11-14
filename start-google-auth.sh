#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                   INICIANDO EXPO CON GOOGLE AUTH                          ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "🔄 Limpiando cache..."
rm -rf .expo node_modules/.cache .expo-shared 2>/dev/null
echo "✅ Cache limpiado"
echo ""
echo "🚀 Iniciando Expo con tunnel para Google OAuth..."
echo ""
echo "⚠️  IMPORTANTE:"
echo "   1. Espera a que aparezca la URL del tunnel (https://...exp.direct)"
echo "   2. Agrega esa URL a Google Cloud Console en tu Web Client"
echo "   3. Guarda los cambios en Google Cloud Console"
echo "   4. Abre la app en el simulador"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npx expo start --tunnel --clear