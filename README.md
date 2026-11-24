# Osiyo moliyaviy inqirozi 1997–1998 — interaktiv 3D-atlas

Statik veb-sayt (faqat RUS tilida), 6 ta davlat: Tailand, Gonkong, Indoneziya, Filippin, Janubiy Koreya, Malayziya.
Auditoriya: iqtisodiyot va xalqaro munosabatlar talabalari. README — o'zbek tilida.

## Ishlatish
- `index.html` ni brauzerda oching (yoki `python -m http.server` bilan). Internet kerak: Three.js r128, OrbitControls va Chart.js 4.4.1 CDN dan yuklanadi (cdnjs, jsdelivr). `npm install` ishlatilmagan; `fetch`/XHR yo'q.
- Klaviatura: ← / → (oldingi/keyingi), Esc (globus), 1–6 (davlat).
- Oqim: kirish globusi → Tailand → Gonkong → Indoneziya → Filippin → Janubiy Koreya → Malayziya → yakuniy globus (1998 YaIM ustunlari).
- Har bir davlatda 5 bo'lim: Tarix, Qahramonlar, Makroiqtisodiy tahlil (3D-simulyator), Zamonaviy yechimlar, Manbalar.

## Fayllar
`index.html`, `css/style.css`, `js/app.js`, `js/data.js`, `js/globe.js`, `js/charts.js`, `js/sims/*.js` (6 ta), `sources.json`, `js/sources.js`, `js/geo.js`.
`js/sources.js` — `sources.json` ning aynan nusxasi (ТЗ `fetch` ni taqiqlagani uchun `<script>` orqali ulanadi; ТЗ dagi fayllar ro'yxatiga qo'shimcha fayl). `img/` bo'sh: fotosuratlar ishlatilmagan.

## Ishtirokchilar bo'linishi
| Ishtirokchi | Davlatlar |
|---|---|
| 1 | Tailand + Gonkong |
| 2 | Indoneziya + Filippin |
| 3 | Janubiy Koreya |
| 4 | Malayziya |
Bo'linish o'zgarsa — shu jadval va `js/data.js` dagi `owner` maydoni yangilanadi.

## Davlatlar va qahramonlar
- Tailand: Chavalit Yongchaiyudh, Amnuay Viravan, Thanong Bidaya.
- Gonkong: Donald Tsang, Joseph Yam, Tung Chee-hwa.
- Indoneziya: Suharto, B. J. Habibie, Michel Camdessus.
- Filippin: Fidel Ramos, Joseph Estrada, Bangko Sentral ng Pilipinas (muassasa).
- Janubiy Koreya: Kim Dae-jung, Financial Supervisory Commission (muassasa), XVF (muassasa) — yagona verifikatsiyalangan shaxs Kim Dae-jung, shuning uchun 2 ta karta muassasa.
- Malayziya: Mahathir Mohamad, Anwar Ibrahim, Ali Abul Hassan (Bank Negara).
Fotosuratlar yo'q: bosh harflar va rangli doira.

## Manbalar
`sources.json`: 57 yozuv — 22 ta `origin: docs` (CORRECTED docx va ТЗ), 35 ta `origin: web` (HKMA, IMF, BNM, BIS, FSC, Bank Indonesia, Bank of Thailand, Britannica va h.k.). Saytdagi har bir «S-xxx» belgisi bosilganda manba oynasi ochiladi.

## Tekshirilmagan ma'lumotlar (saytdan OLIB TASHLANGAN yoki belgilangan)
Olib tashlangan (ikki mustaqil manbadan tasdiqlanmadi):
- Gonkong YaIM 1993–1997 va Malayziya YaIM 1993–1997 (seriyalar versiyalarga qarab farq qiladi; Malayziya 1993 — 8,5 va 1997 — 7,7 faqat bittadan manba). Jadvalda «n/d».
- MAS (1999) nutqi: «peg real kursni oshirdi» sitatasi topilmadi, kiritilmagan.
- Bank Indonesia/depozit sug'urtasi agentligi (LPS) tafsilotlari — tasdiqlanmadi.
- Filippin: «suzuvchi kurs + bank nazorati uyg'unligi» — alohida manba topilmadi, faqat inflyatsiyani nishonga olish va suzish kiritilgan.
- FSC ning aniq tashkil etilgan sanasi (aprel 1998) — tasdiqlanmadi; kiritilmagan.
- Qo'shimcha davlatlar (Singapur, Yaponiya, Xitoy, Tayvan, Vyetnam, Laos, Bruney): ta'sir darajasi bo'yicha raqamlar yo'q — faqat «alohida bo'lim yo'q» xabari.
- Kreditlar/inflyatsiya: Indoneziya sentyabr 1998 inflyatsiyasi (82%) — faqat ТЗ dan (docs).

Belgilangan (bitta manba yoki manbalar farqi — saytda ko'rsatilgan):
- Malayziya chiqish solig'i (exit levy) — bitta manba, URL to'liq tekshirilmagan (S-053).
- Tailand 1993–97 YaIM qatori, Indoneziya/Koreya/Filippin — bitta manba (BNM/IFS, ТЗ §3.4).
- Gonkong 1998 YaIM: −5,1 (HKMA) va −5,9 (FRED/XVF) — ikkalasi ko'rsatilgan.
- Indoneziya 1998: −13,2 (ADB) / −13,7 (BPS). Koreya 1998: −5,8 / −5,1 (qayta ko'rib chiqilgan). Malayziya 1998: −7,5 / −6,7. Tailand: Amnuay iste'fosi 19.06.1997; Thanong tayinlanishi 20 yoki 21.06.1997.

## Tuzatishlar
- Filippin 1998 YaIM: ТЗ da «0,5» (ishorasiz); ikki web-manba (APEC/ITCILO, XVF PIN 99/74) pasayish ≈ −0,5% deb beradi — «−0,5» qabul qilingan.
- Koreya XVF paketi: 58,2 (CRS, docx) va ≈57 (aksariyat manbalar) — ikkalasi ko'rsatilgan.
- «Hypothetical» misol (25 → 50) — gipotetik deb belgilangan (docx tuzatishi).

## Cheklovlar
- Simulyatorlar soddalashtirilgan: «Soddalashtirilgan model. Raqamlar — stsenariy, prognoz emas.» Kalibrovka manbalari har bir simulyator ostida; qolgan parametrlar (pass-through θ, tarmoq bog'lanishlari, «ishsizlik indeksi» va h.k.) — shartli.
- Globus va xaritalar: Natural Earth (world-atlas, jamoat mulki) konturlari, soddalashtirilgan (`js/geo.js`); davlat ustiga bosilsa yaqinlashadi. Yoylar — kapital oqimining illyustratsiyasi, ma'lumot emas.
- «Interpolyatsiya»: Indoneziya inflyatsiya grafigida nuqtalar oralig'i punktir (faqat 3 ta o'lchov: yan/iyun/sent 1998).
- `prefers-reduced-motion`: animatsiya o'chadi. 3D pixelRatio ≤ 2; mobil uchun zarrachalar kamaytirilgan.
- Veb-tekshiruv standart qidiruv orqali o'tkazilgan (WebFetch yo'q): ayrim URL lar qidiruv natijasidan olingan, birlamchi hujjat ichida har bir raqam qo'lda qayta tekshirilmagan.

## Rasmlar (yangilanish)
- Foto: Wikimedia Commons, faqat erkin litsenziyalar (CC0, jamoat mulki, CC BY, CC BY-SA, KOGL Type 1). Har bir rasm uchun muallif va litsenziya `sources.json` da (S-058 …); saytda rasm burchagidagi «©» belgisi shu yozuvni ochadi. Fayllar: `img/people/*`, `img/places/*`, `img/credits.json`, `js/images.js`.
- Dastlabki ТЗ real odamlar fotosini taqiqlagan edi; foydalanuvchi talabi bilan istisno kiritildi: faqat erkin litsenziyali rasmlar.
- Rasmi topilmaganlar (bosh harflar bilan qoldi): Amnuay Viravan, Ali Abul Hassan, tashkilotlar (BSP, FSC, XVF).
- Sharhlar: `S-058…` yozuvlarida CC BY / CC BY-SA talab qiladigan attribution bor; Seul banneri Deoksugung saroyi, Gonkong — Hong Kong Island skyline.

## Dashboard (keng ekran, ≥1000 px)
- Davlat tanlanganda globus unga yaqinlashadi, markazda viloyatlar (admin-1, Natural Earth) xaritasi paydo bo'ladi; atrofida 8 panel: davlat+raqamlar, vaqt, voqealar, qahramonlar, iqtisodiyot grafigi, valyuta kursi 1997–98 (animatsiya), 3D-simulyator, zamonaviy yechimlar. Pastda mexanizm sxemasi.
- Sichqoncha panel (yoki xarita) ustiga kelsa — u kattalashadi, ketsa — qaytadi. Sensorli ekranda panel sarlavhasini bosing. Tor ekranda avvalgi bo'limli interfeys saqlanadi.
- Hammasi yagona vaqtga bog'langan (1997-06 … 1998-12): slayder, o'ynatish, kurs grafigi (bosib/surib), voqea, qahramon — vaqt va viloyat ranglarini o'zgartiradi.
- **Viloyat ranglari — ILLYUSTRATSIYA.** Rang davlat valyutasining dollarga nisbatan o'zgarishidan olinadi (S-002, S-004, S-008, S-009, S-058 — oraliq oylar interpolyatsiya, punktir); poytaxtdan uzoqlashgan sari kechikish va susayish shartli qo'shilgan. Viloyatlar bo'yicha haqiqiy statistika yo'q va uydirilmagan.
- Kurs nuqtalari: Tailand (−20% iyul 1997, −56% yan 1998), Indoneziya (−80% / −81%), Koreya (−55% dek 1997), Malayziya (−45% dek 1997; 1.09.1998 dan fiksatsiya), Filippin (26 → 32 → 43,78 → 39,07 pesoga; foizlar hisoblangan, S-058 — bitta/noaniq manba), Gonkong (peg). Oxirgi nuqtadan keyin grafik to'xtaydi: 1998 yildagi tiklanish tasdiqlanmagan.

## v5 (dashboard tuzatishlari)
- Globus endi markaziy ramka ichida, panellar ustiga chiqmaydi; tanlangan davlat viloyatlari globusning o'zida (3D, rangli) ko'rinadi. Globus ustidagi 1–6 tugmalari yoki globusdagi davlat bosilishi boshqa davlatga o'tkazadi.
- Xarita ustiga borganda kattalashish olib tashlandi. Panellar ustiga borganda kattalashish saqlandi.
- Barcha diagrammalar (YaIM, kurs, 3D-simulyator + natijalar) siqilgan holatda ham ko'rinib turadi.
