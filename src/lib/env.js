/**
 * Validation des variables d'environnement requises
 * Lance une erreur si une variable manque
 */

const requiredEnvVars = {
  VITE_SUPABASE_URL: 'URL de votre projet Supabase',
  VITE_SUPABASE_ANON_KEY: 'Clé anonyme Supabase'
}

// Validation au chargement du module
Object.entries(requiredEnvVars).forEach(([key, description]) => {
  const value = import.meta.env[key]
  
  if (!value || value === 'undefined' || value === 'null' || value.includes('ton-projet') || value.includes('ta-cle')) {
    const errorMessage = `
╔═══════════════════════════════════════════════════════════╗
║  ⚠️  VARIABLE D'ENVIRONNEMENT MANQUANTE                   ║
╠═══════════════════════════════════════════════════════════╣
║                                                            ║
║  Variable manquante : ${key.padEnd(42)} ║
║  Description : ${description.padEnd(47)} ║
║                                                            ║
║  📝 Action requise :                                       ║
║     1. Créez le fichier .env.local à la racine            ║
║     2. Ajoutez : ${key}=your_value    ║
║     3. Redémarrez le serveur                              ║
║                                                            ║
║  📖 Voir ENV_EXAMPLE.md pour plus d'infos                 ║
║                                                            ║
╚═══════════════════════════════════════════════════════════╝
    `
    
    throw new Error(errorMessage)
  }
})

// Log de succès en développement
if (import.meta.env.DEV) {
  console.log('✅ Toutes les variables d\'environnement sont configurées')
}

// Export des variables pour usage dans l'app
export const env = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD
}

