# Hair Art Clinics / Sio Hair Clinic – Ajan Mühendisliği & Operasyon Kuralları (AGENTS.md)

Bu dosya, sistemdeki tüm yapay zekâ ajanları, subagent'lar ve geliştirme süreçleri için bağlayıcı ana kuralları içerir.

---

## 1. Tıbbi & Yasal Güvenlik Kuralları (Medical Safety & Compliance)

> [!CAUTION]
> **TIBBİ TEŞHİS VE GARANTİ YASAĞI**
> Hiçbir ajan kesin tıbbi teşhis koyamaz, tedavi sonucu garantisi veremez veya reçete yazamaz. 
> Ajanlar yalnızca **ön bilgilendirme, triyaj, tahmini greft aralığı ve operasyon hazırlık/sonrası rehberliği** sunar.

1. **Human-in-the-Loop (Doktor Onayı):**
   - Kesin greft sayısı, kişiye özel cerrahi plan, komplikasyon şüphesi ve özel indirim/fiyat teklifleri **mutlaka yetkili klinik personeli veya doktor onayı** gerektirir.
2. **Hollanda Sağlık Mevzuatı (BIG / WGBO):**
   - Hastaya ait cerrahi onam formları, hasta hakları ve tıbbi kayıtlar WGBO standartlarına uygun olarak saklanır.
3. **GDPR & Veri Gizliliği:**
   - Hasta fotoğrafları, telefon numaraları ve sağlık geçmişi hassas kişisel veridir (Special Category Data).
   - Veriler AB sınırları içinde (**GCP `europe-west4` Eemshaven, Hollanda**) işlenmeli ve şifrelenmelidir.
   - Açık rıza (opt-in) olmadan pazarlama mesajı veya otomatik arama yapılamaz.

---

## 2. Mimari Prensipler (System Architecture Rules)

1. **Tek Doğru Veri Kaynağı (Single Source of Truth):**
   - **Clinic Command Center (Supabase)** kliniğin ana kayıt merkezidir (System of Record).
   - Signal (web sitesi) yalnızca bir vitrin ve lead toplama kanalıdır; lead'ler güvenli bir ingestion katmanından geçerek Command Center'a akar.
2. **Hata Dayanıklılığı & İdempotency:**
   - WhatsApp, form veya telefon webhook'ları mükerrer çağrıldığında aynı işlem iki kez çalıştırılmamalıdır (Idempotency Key zorunludur).
3. **Kill Switch & Güvenlik:**
   - Her ajanın acil durumlarda tek tıkla durdurulabileceği bir devre kesici (kill switch) bulunmalıdır.
4. **Secret Güvenliği:**
   - Hiçbir API anahtarı (OpenAI, Gemini, Twilio, Supabase Service Role vb.) koda veya frontend tarafına yazılmaz; **GCP Secret Manager** üzerinden yüklenir.

---

## 3. 8 Süper Ajan Yapılanması

1. 🧠 **Executive AI (Cio):** KPI takibi, günlük klinik özetleri, riskli durum alarmları.
2. 💬 **Patient Experience & Voice AI:** WhatsApp, telefon (Inbound/Outbound Sesli Ajan), Web Chat ve E-posta yönetimi.
3. 🩺 **Medical AI:** 2R Bilgi Bankası protokolleri, teknik anlatımları (FUE, DHI, Safir), greft ön hesaplama.
4. 📅 **Operations AI:** Ameliyat odası, doktor/ekip takvimi, VIP transfer ve otel koordinasyonu.
5. 📈 **Growth & Marketing AI:** Search Console, yerel SEO (Hollanda şehirleri), Google/Meta reklam analitiği.
6. 💰 **Finance & Billing AI:** Fiyatlandırma paketleri, teklif taslakları, Stripe/Mollie ödeme takipleri.
7. 📊 **Analytics & Compliance AI:** GDPR denetimi, dönüşüm oranları (CAC/LTV), hasta memnuniyeti (NPS).
8. ⚙️ **Integration & Ingestion AI:** Signal ↔ Command Center köprüsü, kuyruk yönetimi (Cloud Tasks), harici API entegrasyonları.
