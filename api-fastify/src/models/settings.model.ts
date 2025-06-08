import { Schema, model, Document } from 'mongoose';

export interface ISettings extends Document {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  postsPerPage: number;
  registrationEnabled: boolean;
  emailVerificationRequired: boolean;
  commentsEnabled: boolean;
  defaultUserRole: string;
  aiEnabled: boolean;
  aiModel: string;
}

const SettingsSchema = new Schema<ISettings>({
  siteName: { type: String, default: 'Mon Blog' },
  siteDescription: { type: String, default: 'Un blog moderne avec IA' },
  contactEmail: { type: String, default: 'contact@example.com' },
  postsPerPage: { type: Number, default: 10 },
  registrationEnabled: { type: Boolean, default: true },
  emailVerificationRequired: { type: Boolean, default: true },
  commentsEnabled: { type: Boolean, default: true },
  defaultUserRole: { type: String, default: 'user' },
  aiEnabled: { type: Boolean, default: true },
  aiModel: { type: String, default: 'gpt-3.5-turbo' },
}, { timestamps: true });

const Settings = model<ISettings>('Settings', SettingsSchema);

export default Settings;
