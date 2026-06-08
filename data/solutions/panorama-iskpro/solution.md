# İsk/Pro

_Kaynak: Panorama Kullanım Kılavuzu_

**Menü Adımı:** `Satış Ve Pazarlama Kriterleri → İskonto Promosyon → İsk`

## Ekran Tanımı

Iskonto/Promosyon bilgilerinin tanımlandığı ekrandır.

## Alan Açıklamaları

| Alan | Açıklama |
| --- | --- |
| Kod | Iskonto/promosyon tanımına program tarafından verilen artışlı numaradır. |
| Başlangıç Tarihi | Iskonto/Promosyon başlangıç tarihidir. |
| Belge Tür | Iskonto/Promosyon kayıtlarının hangi belge türlerinde uygulanacağı bilgisidir.Iskonto/Promosyon sadece seçilen belge tiplerinde uygulanır |
| Vade Günü | Vade gün kriter bilgisidir. Iskonto promosyon sadece yazılan vade günü içeren belgelerde uygulanır. |
| Bütçede Uygula | Tanımlanan iskonto tanımının Distibütör harcama bildirim ekranında merkeze faturalanması istendiğinde alan evet olarak işaretlenmelidir. |
| Bitiş Tarihi | Iskonto/Promosyon bitiş tarihidir. |
| Belge Tipi | Iskonto/Promosyon kayıtlarının hangi belge tiplerinde uygulanacağı değeri girilir. |
| İskonto Promosyon Metni | Iskonto promosyonun uygulanma amacına ilişkin bir metin girilebilir. |
| Bütçe Oranı | Bütçede uygula seçeneğinin evet olması durumunda Sahaya uygulanan iskonto tutarının ne kadarlık bölümünün merkeze faturalanacğının belirlendiği alandır. |
| Durum | Iskonto/Promosyon durum bilgisidir. Aktif ve Pasif değerini alabilir. Pasif olan ıskonto/Promosyonlar belgelerde uygulanmaz. |
| Onay | Iskonto promosyonun iş akış onay durumunu gösterir. Durumu 'Onaylanmadı' olan kayıtlar belgede uygulanmaz. |
| Uygulama Yeri | Iskonto Promosyonun kullanılacağı modül bilgisinin tutulduğu alandır. |
| İade Ceza İsk. | Satış temsilcisi iade limiti dolması durumunda ceza iskonto uygulaması amacı ile kullanılır. |
| Hizmet Ürünü | Bütçede uygula evet seçildiği durumda Dsitribütör harcama bildirimi ekranında hesaplanan tutarım merkeze faturalanması adımında faturada yer alacak hizmet ürünününün seçim alanıdır. |
| Distribütör Kriter Tipi | Tanımın Hangi Distribütör için geçerli olacağını belirlemek için kullanılır. Kriter tipi Kod, Grup, Ek Grup, Dinamik Grup değerleri alır. |
| Distribütör Kriteri | Kriter tipinde yapılan seçime göre değerlerin seçildiği alandır. Örneğin Kriter tipi kod seçildi ise Distribütör kodu listesi üzerinden distribütör seçimi yapılır. Boş bırakıldığı durumda tüm distribütörler için geçerli olacaktır. Uygulama sadece seçili distribütörler için uygulanır. |
| Uygulama Kriterleri Kullanılsın | Tanımlanan Iskonto uygulama kriterlerinin kullanılabilmesi için seçilir. Seçildiği anda Distribütör ve Müşteri kriteri seçenekleri pasif olur. |
| Uygulama Kriteri | Tanımlanan Iskonto uygulama kriteri rehberden seçilir. |
| Müşteri Kriter Tipi | Tanımın Hangi Müşteri için geçerli olacağını belirlemek için kullanılır. Kriter tipi Kod, Grup, Ek Grup, Dinamik Grup, Bölge, Satış Temsilcisi, Ek Saha değerlerini alır. |
| Müşteri Kriter | Müşteri Kriter Tipi ne göre değişkenlik gösteren bir alandır. Örneğin Müşteri Kriter Tipi “Kod” seçilirse sisteme kayıtlı tüm Müşteriler gelir ve tek bir Müşteri seçilebilir fakat Müşteri Kriter Tipi “Grup” seçilir ise Müşteri grupları seçilir ve o gruba dahil olan tüm müşterilere fiyat tanımlanmış olur. |
| Ek Saha Kriteri | Müşteri kriter tipinde Ek Saha seçimi yapıldığında devreye giren alandır. Ek saha kriterinin seçimi için kullanılır. |
| Hedef Ürün Kriter Tip | Iskonto/Promosyonun Hangi Ürün alımlarında geçerli olacağını belirlemek için kullanılır. Kriter tipi Kod, Grup, Ek Grup, Dinamik Grup, Miktarlı Dinamik Grup, Seviyeli Grup 1, Seviyeli Grup 2 ve Ek Saha tipleri seçilir. |
| Hedef Ürün Kriter | Kriter tipinde yapılan seçime göre değerlerin seçildiği alandır. Bu alanda yapılan seçime göre belgelerde kriterde seçilen ürünler kontrol edilecek ve Iskonto Promosyon hak edip edilmediği hesaplanacaktır. |
| Ek Saha Kriteri | Hedef ürün kriter tipinde Ek Saha seçimi yapıldığında devreye giren alandır. Ek saha kriterinin seçimi için kullanılır. |
| Hedef Tip | Hedef Tipi değeridir. Miktar, Tutar, Ağırlık, Hacim, SKU Çeşidi, Litre değerlerini alır. Hedef ürün kriterinde seçilen ürünler için değerlendirilecek kayıt tipidir. |
| Hedef Ürün Birimi | Hedef tipi miktar seçildiği durumda dikkate alınacak birim değeridir. 1.2.3.4 ve 5.Birim değerlerini alabilir. |
| Distribütör Kota Tutarı | Distribütör kota tutar değerinin girildiği alandır. Bu alana örneğin 10000 değeri yazılırsa;Bir distribütör için ilgili iskonto tüm müşterilerde toplam 10000 Tl'lik hediye verdiğinde tanım atık uygulanmaz. |
| UygulamaTipi | ıskonto/Promosyonun uygulama tipi bilgisidir. Satır ve Genel değerlerini alır. Satır tipinde ıskonto Satıra, Genel tipinde ise ıskonto fatura geneline uygulanır. |
| Bilgi | Iskonto tanımı için bilgi girişi yapıldığı alandır. |
| Maks. Uygulama Sayısı | Iskontonun bir noktaya en fazla kaç kez uygulanacağı bilgisidir. Girilen değer kadar uygulandıktan sonra o noktaya tanımlanan ıskonto bir daha uygulanmaz. Bu özellik kullanılmayacak ise değer olarak 0(Sıfır) girilir. |
| Maks.Uygulama Tutarı | Iskontonun bir noktaya en fazla kaç TL'lik hediye verebileceği bilgisidir. Girilen değer kadar hediye verildikten sonra o noktaya tanımlanan ıskonto bir daha uygulanmaz. Bu özellik kullanılmayacak ise değer olarak 0(Sıfır) girilir. |
| Kümülatif Miktar Desteği Uygulansın | İlgili seçenek sadece satış faturasında uygulanan iskontolarda seçilir. İşaretlenir ise kademe olarak girilen alt limit değerinin tek belgede sağlanma şartı aranmaz iki yada üçüncü faturada alt limit sağlandığında iskonto uygulanır. |
| Promosyon Koli içinden uygulansın | Promosyon verilecek ürünün koli bütününü bozmaması için seçilir. Promosyon ürün kolinin içindeki miktardan verilir. |
| Azalan Hedef Kademe Uygula | Satış yapılan müiktarın kademe değerlerine göre hediyesini verir. |
| Bir üst kademe İsk/Pro önerilsin mi? | Bir üst kademe iskonto öneri uygulaması açılır. |
| Otomatik Fiyat Oluşturulsun | Hedef ürün kriterindeki ürünlere aynı anda fiyat tanımı yapılmasını sağlar. |
| Yenile | Kademe giriş sayfasını yeniler. |
| Yeni | Kademe giriş sayfasını açar. |
| Düzenle | Girilmiş olan kademe bilgisini düzenler. |
| İzle | Girilmiş olan kademe sayfasını izle modunda açar. |
| Sil | Girilmiş olan kademe satırını siler. |
| Koşul | Koşul sayfasını açar. |
| Hediye | Hediye sayfasını açar. |
| Hediye Grup | Hediye grup sayfasını açar. |
| Kota | Iskonto tanımna kota girişi yapılmasını sağlar. |
| Alt Limit | Hedef için verilen Alt limit değeridir. |
| Üst limit | Hedef için verilen Üst limit değeridir. |
| Hedef | Hedef bilgisidir, Hedef için kontrol edilen rakam tanımlı kademeye uyduğu durumda ıskontoyu hak etmesi için kontrol edilecek hedef değeridir. Ayrıca hediye tipi ürün olduğu durumda istenirse gerçekleşen her hedef için hediye hak edilmesi sağlanabilir. |
| Hediye Bağlantı | Birden fazla hediye tanımlandığı durumda her hediyelerin birbirleri arasındaki bağlantıyı belirtir. Ve seçildiğinde tanımlı her hediye uygulanır Veya seçildiği durumda Tanımlı hediyeler arasından seçim yapılması istenir. |
| Koşul Bağlantı | Hediyenin gerçekleşmesi için koşul ürün yapılmaktadır. Bir kademeye ait birden fazla koşul satırı girildiğinde satırlar arasındaki bağlantı belirtilir. Ve seçili olduğu durumda koşulda yer alan her satırın belge detayında olması kontrol edilir veya olduğu durumda satırlardan bir tanesi bile belgede yer alıyorsa ıskonto hak edilir. |
| Kriter Tipi | Koşul ürün kriter tipidir. Kod, Grup, Ek Grup ve Dinamik Grup değerlerini alabilir. |
| Kriter | Koşul tipi seçimine göre ürün kriterinin seçildiği alandır. |
| Koşul Tipi | Koşul tipi alanıdır. Miktar, Tutar, Ağırlık, Hacim, SKU, Litre değerlini alır. |
| Ürün Birimi | Hedef tipi miktar seçildiği durumda dikkate alınacak birim değeridir. 1,2,3,4 ve 5.Birim değerlerini alabilir. |
| Koşul Değeri | Belirtilen ürün kriteri için istenen koşul tipinde(Miktar, Tutar) koşulun gerçekleşmesi için gerçekleşmesi gereken minimum değerdir. |
| Çeşit Kontrol Tipi | Çeşit kontrolünün belge bazındamı yoksa koşul kriteri içersindemi yapılacağı seçilir. |
| Koşul Kriter Tipi | Çeşit kontrolünün hamgi kriterde yapılacağı seçilir. Ürün kod,grup,ek grup,üretici değerlerinde biri seçilebilir. |
| Çeşit Sayısı | Seçilen kritere göre kaç çeşit değeri kontrol edileceği girilir. Örneğin ; Belgede 3 farklı çeşit ürün olmalıdır, gibi. |
| Miktar | Hediye Miktar bilgisidir. Hediye ıskonto(%) tipinde ise girilen değer oran, ıskonto(Tutar) ise Tutar, iskonto tipi ürün ise promosyon adet olarak kabul edilir. |
| Tip | Hediye tipini belirtmektedir. Ürün, İskonto1.2,3…8, Ürün grubu –Ürün Ek Grubu, Puan değerlerini alabilir. |
| Ürün Birimi | Hediye ürün miktarının birim bilgisidir. |
| Maksimum Kat | Kademede belirtilen hedef değerinin katları cinsinden hediye miktarı da çarpılıp hediye ürün miktarı hesaplanır. Hedef değeri 10 ve gerçekleşen satış 90 ise hediye miktarı 9 kat fazla verilir. Hediyenin Sadece 1 kez verilmesi isteniyor ise bu alana 1 yazılır. |
| Hedef Değeri | Girilen hediyenin hedef değeri girilir. |
| Promosyon Sıra | Verilen promosyon ürünün hangi sırada verileceği seçilir. |
| Bağlantı | Birden fazla hediye tanımlandığı durumda her hediyelerin birbirleri arasındaki bağlantıyı belirtir. Ve seçildiğinde tanımlı her hediye uygulanır Veya seçildiği durumda Tanımlı hediyeler arasından seçim yapılması istenir. |
| Ürün | Hediye tipi Ürün, Ürün Grubu-Ek grubu seçildi ise Hediye tipine göre seçimin yapılacağı ekrandır. |
| Çakışma Tipi | Parametre ayarlamalarında “ıskonto/promosyon çakışma tanımlanacak mı?” parametresi açık olduğunda devreye girer. Tanımlanan ıskontonun başka bir ıskonto ile çakıştığında izleyeceği yolu göstermek için kullanılır. Her koşulda uygula ve Diğer İsk/Pro Uygulama seçeneklerinden biri seçilebilir. |
| Çakışma Tipleri | Çakışma durumu oluştuğunda hangi ıskontonun uygulanıp, hangi ıskontonun uygulanmayacağı seçiminin yapıldığı alandır. |
| Brüt tutar üzerinden ağırlıklı ortalama ile dağıtılsın | Hediye olarak tutar iskonto satırına değer veriliyor ise ve verilen hediye tutarının belgedeki diğer satırlara dağıtılması isteniyor ise işaretlenir. |

## Buton Açıklamaları

| Alan | Açıklama |
| --- | --- |
| Kaydet Ve Yeni | Iskonto/promosyon tanımı kayedilir ve yeni bir form açılır. |
| Kaydet Ve Kapat | Iskonto/promosyon tanımı kayedilir. |
| Aksiyon Listesi | Iskontonun uygulandığı kayıtların görüntülenmesini sağlar. |
| Kapat | Iskonto formu kapatılır. Girilen veriler kaydedilmez. |


---
_Yol: EnRoute Panorama › Satış ve Pazarlama Kriterleri › İskonto/ Promosyon_
