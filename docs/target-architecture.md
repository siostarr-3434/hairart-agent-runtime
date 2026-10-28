# Hedef Sistem Mimarisi (Target Architecture)

Bu doküman, Hair Art Clinics / Sio Hair Clinic bünyesinde çalışacak yapay zekâ destekli klinik otomasyon sisteminin teknik mimarisini tanımlar.

---

## 1. Veri Akışı ve Katmanlar

```text
                        HASTA VE ZİYARETÇİ KANALLARI
   ┌──────────────────────┬──────────────────────┬──────────────────────┐
   │ Public Website       │ WhatsApp & Sosyal    │ Sesli Çağrı Santrali │
   │ (Signal - Lovable)   │ (Cloud API / Meta)   │ (Twilio / WebRTC)    │
   └──────────┬───────────┴──────────┬───────────┴──────────┬───────────┘
              │                      │                      │
              │                      │                      │
              ▼                      ▼                      ▼
┌───────────────────────────────────────────────────────────────────────┐
│                    GOOGLE CLOUD PLATFORM (GCP)                        │
│                 Bölge: europe-west4 (Eemshaven / NL)                  │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ 1. INGESTION & AGENT RUNTIME (Google Cloud Run)                 │  │
│  │    • Webhook Dinleyicileri (Signal, WhatsApp, Twilio)           │  │
│  │    • Idempotent Deduplication (Tekilleştirme)                  │  │
│  │    • 8 Süper Ajan Orkestratörü (Agent Runtime)                  │  │
│  │    • Human Approval Kontrol Motoru                              │  │
│  └────────────────┬────────────────┬───────────────────────────────┘  │
│                   │                │                                  │
│       ┌───────────┴────────┐   ┌───┴────────────────┐                 │
│       ▼                    ▼   ▼                    ▼                 │
│  [ Vertex AI ]       [ Cloud Tasks ]      [ Secret Manager ]          │
│  • Gemini Live API   • 1, 3, 10. gün      • Supabase Service Keys     │
│  • Multimodal Foto     Aftercare Takibi   • WhatsApp & Twilio Tokens  │
│    Analizi (Norwood) • Gecikmeli Görevler • AI Model Keys             │
└───────┬───────────────────────────────────────────────────────────────┘
        │
        ▼ (Güvenli & Yetkili Veritabanı Erişimi)
┌───────────────────────────────────────────────────────────────────────┐
│              CLINIC COMMAND CENTER (Supabase PostgreSQL)              │
│                     [ TEK DOĞRU VERİ KAYNAĞI ]                       │
│  • contacts, leads, patients                                          │
│  • conversations, messages, aftercare_checkins                        │
│  • appointments, operations, payments                                 │
│  • agent_runs, tool_calls, agent_approvals, audit_logs                │
└───────────────────────────────────┬───────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                    CLINIC COMMAND CENTER UI                           │
│                     (Doktor & Personel Paneli)                        │
│  • Bekleyen Teklif & Ameliyat Onayları                                │
│  • Hasta Takip & Fotoğraf Değerlendirme                               │
│  • Ajan Kill Switch ve Müdahale Ekranı                                │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 2. Temel İlkeler

1. **Signal (Lovable/Web):** Sadece trafik, SEO ve lead formları için kullanılır. Doğrudan ameliyat veya ödeme verisi tutmaz.
2. **Clinic Command Center (Supabase):** Tüm hasta operasyonunun atan kalbidir.
3. **Google Cloud Run (Agent Runtime):** Ajan mantığının, araçlarının (tool calls), sesli çağrıların ve kuyruk dinleyicilerinin çalıştığı sunucusuz mikroservis katmanıdır.
4. **Veri Yerleşimi (Data Residency):** Tüm GCP servisleri **`europe-west4` (Hollanda)** seçilerek GDPR uyumu garanti altına alınır.
