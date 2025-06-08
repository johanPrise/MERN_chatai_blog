import React, { useState } from "react"

interface SettingsSectionProps {
  title: string
  description: string
  children: React.ReactNode
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, description, children }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>
      {children}
    </div>
  )
}

interface ToggleSettingProps {
  id: string
  label: string
  description: string
  isEnabled: boolean
  onChange: (enabled: boolean) => void
}

const ToggleSetting: React.FC<ToggleSettingProps> = ({ id, label, description, isEnabled, onChange }) => {
  return (
    <div className="flex items-start justify-between py-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <div>
        <label htmlFor={id} className="font-medium text-gray-900 dark:text-white">{label}</label>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <div className="relative inline-block w-12 align-middle select-none mt-1">
        <input
          type="checkbox"
          id={id}
          checked={isEnabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={`block w-12 h-6 rounded-full transition-colors ${isEnabled ? 'bg-lime-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform ${isEnabled ? 'translate-x-6' : ''}`}></div>
      </div>
    </div>
  )
}

interface SelectSettingProps {
  id: string
  label: string
  description: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}

const SelectSetting: React.FC<SelectSettingProps> = ({ id, label, description, value, options, onChange }) => {
  return (
    <div className="py-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <label htmlFor={id} className="block font-medium text-gray-900 dark:text-white mb-1">{label}</label>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{description}</p>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

interface InputSettingProps {
  id: string
  label: string
  description: string
  value: string
  type?: string
  onChange: (value: string) => void
}

const InputSetting: React.FC<InputSettingProps> = ({ id, label, description, value, type = "text", onChange }) => {
  return (
    <div className="py-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <label htmlFor={id} className="block font-medium text-gray-900 dark:text-white mb-1">{label}</label>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{description}</p>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      />
    </div>
  )
}

export const AdminSettings: React.FC = () => {
  // États pour les paramètres
  const [registrationEnabled, setRegistrationEnabled] = useState(true)
  const [emailVerificationRequired, setEmailVerificationRequired] = useState(true)
  const [commentsEnabled, setCommentsEnabled] = useState(true)
  const [defaultUserRole, setDefaultUserRole] = useState("user")
  const [postsPerPage, setPostsPerPage] = useState("10")
  const [siteName, setSiteName] = useState("Mon Blog")
  const [siteDescription, setSiteDescription] = useState("Un blog moderne avec IA")
  const [contactEmail, setContactEmail] = useState("contact@example.com")
  const [aiEnabled, setAiEnabled] = useState(true)
  const [aiModel, setAiModel] = useState("gpt-3.5-turbo")
  
  // Fonction pour sauvegarder les paramètres
  const saveSettings = async () => {
    const settings = {
      registrationEnabled,
      emailVerificationRequired,
      commentsEnabled,
      defaultUserRole,
      postsPerPage: parseInt(postsPerPage),
      siteName,
      siteDescription,
      contactEmail,
      aiEnabled,
      aiModel
    }
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Erreur lors de la sauvegarde des paramètres")
      }
      alert("Les paramètres ont été enregistrés avec succès !")
    } catch (err: any) {
      alert("Erreur lors de la sauvegarde : " + (err.message || err))
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Paramètres du site</h2>
        <button
          onClick={saveSettings}
          className="px-4 py-2 bg-lime-600 text-white rounded-md hover:bg-lime-700 transition-colors"
        >
          Enregistrer les modifications
        </button>
      </div>
      
      <SettingsSection
        title="Paramètres généraux"
        description="Configurez les paramètres généraux de votre site."
      >
        <InputSetting
          id="site-name"
          label="Nom du site"
          description="Le nom qui apparaîtra dans l'en-tête et le titre des pages."
          value={siteName}
          onChange={setSiteName}
        />
        
        <InputSetting
          id="site-description"
          label="Description du site"
          description="Une brève description de votre site pour les moteurs de recherche."
          value={siteDescription}
          onChange={setSiteDescription}
        />
        
        <InputSetting
          id="contact-email"
          label="Email de contact"
          description="L'adresse email utilisée pour les notifications et les contacts."
          type="email"
          value={contactEmail}
          onChange={setContactEmail}
        />
        
        <SelectSetting
          id="posts-per-page"
          label="Articles par page"
          description="Nombre d'articles à afficher par page dans les listes."
          value={postsPerPage}
          options={[
            { value: "5", label: "5 articles" },
            { value: "10", label: "10 articles" },
            { value: "15", label: "15 articles" },
            { value: "20", label: "20 articles" },
          ]}
          onChange={setPostsPerPage}
        />
      </SettingsSection>
      
      <SettingsSection
        title="Paramètres des utilisateurs"
        description="Configurez les options liées aux utilisateurs et à l'inscription."
      >
        <ToggleSetting
          id="registration-enabled"
          label="Inscription des utilisateurs"
          description="Permettre aux nouveaux utilisateurs de s'inscrire sur le site."
          isEnabled={registrationEnabled}
          onChange={setRegistrationEnabled}
        />
        
        <ToggleSetting
          id="email-verification"
          label="Vérification par email"
          description="Exiger que les utilisateurs vérifient leur adresse email lors de l'inscription."
          isEnabled={emailVerificationRequired}
          onChange={setEmailVerificationRequired}
        />
        
        <SelectSetting
          id="default-role"
          label="Rôle par défaut"
          description="Le rôle attribué aux nouveaux utilisateurs lors de l'inscription."
          value={defaultUserRole}
          options={[
            { value: "user", label: "Utilisateur" },
            { value: "author", label: "Auteur" },
            { value: "editor", label: "Éditeur" },
          ]}
          onChange={setDefaultUserRole}
        />
      </SettingsSection>
      
      <SettingsSection
        title="Paramètres des commentaires"
        description="Configurez les options liées aux commentaires sur les articles."
      >
        <ToggleSetting
          id="comments-enabled"
          label="Commentaires"
          description="Permettre aux utilisateurs de commenter les articles."
          isEnabled={commentsEnabled}
          onChange={setCommentsEnabled}
        />
      </SettingsSection>
      
      <SettingsSection
        title="Paramètres de l'IA"
        description="Configurez les options liées à l'intelligence artificielle."
      >
        <ToggleSetting
          id="ai-enabled"
          label="Fonctionnalités d'IA"
          description="Activer les fonctionnalités d'intelligence artificielle sur le site."
          isEnabled={aiEnabled}
          onChange={setAiEnabled}
        />
        
        <SelectSetting
          id="ai-model"
          label="Modèle d'IA"
          description="Le modèle d'IA à utiliser pour les fonctionnalités d'intelligence artificielle."
          value={aiModel}
          options={[
            { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
            { value: "gpt-4", label: "GPT-4" },
            { value: "claude-3-opus", label: "Claude 3 Opus" },
            { value: "claude-3-sonnet", label: "Claude 3 Sonnet" },
          ]}
          onChange={setAiModel}
        />
      </SettingsSection>
    </div>
  )
}
