# Google Cloud Platform (GCP) Kurulum Rehberi
**Hesap:** `siostarr@hairartclinics.com`  
**GCP Proje ID:** `hair-art-son`  
**GCP Proje Numarası:** `1084281821239`  
**Hedef Bölge:** `europe-west4` (Eemshaven, Hollanda)

---

## 1. GCP Proje Bilgileri
- **Project Name:** Hair Art Clinics
- **Project ID:** `hair-art-son`
- **Project Number:** `1084281821239`
- **Default Region:** `europe-west4` (Eemshaven, Hollanda)

---

## 2. Etkinleştirilecek Google Cloud API'ları

GCP Console > **APIs & Services > Library** ekranından (veya gcloud CLI ile) şu servisleri etkinleştirin:

- [ ] **Cloud Run API** (`run.googleapis.com`) – Ajan motoru ve container servisleri.
- [ ] **Vertex AI API** (`aiplatform.googleapis.com`) – Gemini 2.0 / 3.8 modelleri ve sesli yapay zekâ (Live API).
- [ ] **Cloud Tasks API** (`cloudtasks.googleapis.com`) – Post-op takip mesajları kuyruğu.
- [ ] **Secret Manager API** (`secretmanager.googleapis.com`) – API anahtarları ve şifre kasası.
- [ ] **Cloud Build API** (`cloudbuild.googleapis.com`) – GitHub ile otomatik deploy.
- [ ] **Artifact Registry API** (`artifactregistry.googleapis.com`) – Docker container imajları deposu.

---

## 3. Secret Manager Yapılandırması

Secret Manager üzerinde aşağıdaki anahtarlar oluşturulacaktır:

| Secret Adı | Açıklama |
|---|---|
| `SUPABASE_URL` | Clinic Command Center Supabase URL (`djbflsqljeoptmpruhka`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Command Center servis yetkili anahtarı (arka plan ajanları için) |
| `SIGNAL_SUPABASE_URL` | Signal web sitesi Supabase URL (`vpanoajjzzakjbsbkwoo`) |
| `WHATSAPP_API_TOKEN` | Meta WhatsApp Cloud API erişim belirteci |
| `TWILIO_ACCOUNT_SID` / `TOKEN` | Sesli arama (Voice AI) santral anahtarları |
| `GEMINI_API_KEY` | Gemini API anahtarı |

---

## 4. GitHub & CI/CD Entegrasyonu

Yerel kodlar (`KLINIK Ajanlari`):
1. GitHub deposuna bağlanır.
2. Cloud Run'a otomatik deploy için **Cloud Build** veya **GitHub Actions** kullanılır.
3. Her commit/PR ile testler çalıştırılır ve production imajı `europe-west4` bölgesinde ayağa kaldırılır.
