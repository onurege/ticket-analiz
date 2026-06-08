# Satış Temsilcisi

_Kaynak: Panorama Kullanım Kılavuzu_

**Menü Adımı:** `Satış Ekibi → Tanımlamalar → Satış Temsilcisi`

## Ekran Tanımı

Sistemi kullanacak Satış Temsilcilerinin tanımlandığı ekrandır. Öncelikle ekrana, sisteme tanımlanmış olan temsilci listesi gelir.

## Alan Açıklamaları

| Alan | Açıklama |
| --- | --- |
| Takip Kodu | Sistem tarafından verilen otomatik artan numaradır |
| Durum | Satış temsilcisi Durum bilgisidir. Aktif veya Pasif değerleri alır. |
| Kodu | Satış temsilcisine kullanıcı tarafından verilen kod bilgisidir. |
| Adı | Satış temsilcisinin ad bilgisidir. |
| Tip | Satış Temsilcisi tip bilgisidir. “Elektronik Sipariş” ve “Mobil Satış Dağıtım” değerlerini alır. Mobil satış dağıtım uygulaması kullanılıyor ise mutalaka “Mobil Satış Dağıtım” seçilir. |
| Personel Kodu | Satış temsilcisine ait detay bilgilerinin girilebildiği personel tanımıdır. Personel tanımında Satış temsilcisine ait özlük bilgileri girilmektedir. Yeni satış temsilcisi kayıt işleminde bu alana bir şey girilmeyebilir. Program otomatik olarak bu temsilci için personel tanımı oluşturur ve yeni oluşturulan personel bu alanda otomatik seçimi yapılmış olur. |
| Distribütör | Satış temsilcisinin bağlı olduğu distribütör bilgisidir. |
| Yetki Şablonu | Satış temsilcisinin çalışma şeklinin belirlendiği şablonun kod bilgidir. Otomatik olarak seçili gelir. |
| Müfettiş | SE tipinde tanımlanan elemanın müfettişi bilgisidir. |
| ST Grup Kodu | Satış temsilcisi Grup bilgisidir. Tanımlı olan gruplardan biri seçilir. |
| Saha Elemanı | Quest modülü işlemlerinde kullanılmak üzere yaratılan Saha elemanı kodudur. Mobil satış dağıtım modülü uygulamasında da kullanılır. Yeni satış temsilcisi kayıt işleminde bu alana bir şey girilmeyebilir. Program otomatik olarak bu temsilci için saha elemanı tanımı oluşturur ve yeni oluşturulan saha elemanı bu alanda otomatik seçimi yapılmış olur. Mobil satış dağıtım modülü |
| Araç Depo Kodu | Satış temsilcisinin hangi depo üzerinde çalışacağının belirtildiği bir alandır. Örneğin Sıcak ve Karma satış tipi için Araç Depo kodu olarak satış temsilcisine tanımlanan depo seçilmelidir. Soğuk satış tipi için Merkez depo seçilebilir. |
| Dağıtıcı | ST ile ilişkili olarak dağıtım işlemlerinde kullanılacak Dağıtıcı tanımı bilgisidir. |
| Çalışma Tipi | Satış temsilcisinin çalışma tipidir. Bu alan “Sıcak Satış”, “Soğuk Satış”, “Karma” ve “Depocu” değerlerini alabilir. Seçilen değere göre el terminalinde açılacak menüler belirlenir. |
| Barkod Okuyucu | Satış temsilcisinin el terminali tipine göre eğer terminalde barkod okuyucusu var ise barkod okuyucusunun modelinin girildiği alandır. |
| El Bilgisayar Tipi | El bilgisayarının işletim sisteminin girildiği alandır. |
| Şifre | El terminali üzerinde çalışan programdan çıkış için istenilen şifre bilgisidir. |
| Yazıcı Tipi | El terminalinde kullanılacak yazıcı tipinin belirtildiği alandır. “Dar” ve “Geniş” değerlerini alabilir. 40 kolon çıktı alınabilen printerlar için Dar, 80 kolon çıktı alınabilen printerlar için Geniş seçilir. |
| Haberleşme Tipi | El terminalinin Panorama ile haberleşmede kullanacağı haberleşme tipidir. Panorama için GPRS seçilir. |
| Kredi Çarpan | Satış temsilcisine tanımlanan kredi çarpan bilgisidir. Buraya girilen değer yetki ve parametre şablon ekranında katsayı ile çarpılarak Kredi Limiti bölümüne hesaplanır. |
| Kredi Limit | Satış temsilcisi kredi limiti tanımıdır. |
| Sıra | Rut tanım sıra bilgisidir. Sistem tarafından otomatik olarak verilmektedir. |
| Sevk Günü | Başlangıç gününün ardından kaçıncı gün başlanacağı belirtilir. |
| Başlangıç Tarihi | Rut tanımının satış temsilcisi için geçerli olacağı başlangıç tarihidir. Buraya girilen tarih rut tanımının ilk hangi gün başlayacağı bilgisidir. Örneğin Pazartesi gidilecek bir rut ise buradaki tarihin de Pazartesi olan bir tarih girilmelidir. |
| Bitiş Tarihi | Rut tanımının satış temsilcisi için geçerli olacağı bitiş tarihidir. |
| Frekans Birimi | Frekans Birimi alanıdır. Alan “Gün”, “Hafta” ve “Ay” değerini alır. Başlangıç tarihi alanında girilen tarihteki güne denk gelen rutun bir sonraki gidiş için frekans birimi seçilir. Örneğin Her hafta Pazartesi gidilecek ise burada hafta seçilir. |
| Frekans | Frekans Değeridir. Frekans birimi alanında seçilen bilgiye göre kaç defada bir gidilecek bilgisidir. Örneğin her hafta Pazartesi gidilecek ise frekans 1 seçilir. 2 haftada bir gidilmesi için buraya 2 girilir. |
| Pazar Dahil | Tanımlanacak rutta Pazar günlerinin seçimi için işaretlenir. |
| Rut Kodu | Belirtilen tanımın hangi rut için uygulanacağının seçildiği alandır. Rut listesinden seçim yapılır. |
| Audit Ziyaret Kodu | Audit işlemi için uygulanacak rutun listeden seçimi yapılır |
| Başlangıç Tarihi | İznin başlangıç tarihidir. |
| Bitiş Tarihi | İznin bitiş tarihidir. |
| İzin Nedenleri | İzin tanımlarının yapıldığı ve çoklu seçim olarak seçildiği sahadır. |

## Buton Açıklamaları

| Alan | Açıklama |
| --- | --- |
| BUTON | AÇIKLAMA |
| Rut Bilgileri | ST rut atamalarının yapıldığı butondur. |
| Tatil Günleri | ST tatil günlerinin girildiği butondur. |
| Ürün Grupları | ST`nin satışta yetkili olduğu ürün gruplarının tanımlandığı butondur. |
| Kaydet ve Yeni | Yapılan girişleri kaydeder ve yeni boş bir sayfa açar. |
| Kaydet ve Kapat | Yapılan girişleri kaydeder ve sayfayı kapatır. |
| Kapat | Sayfayı kapatır. |


---
_Yol: EnRoute Panorama › Satış Ekibi › Tanımlamalar_
