# Teklif

_Kaynak: Panorama Kullanım Kılavuzu_

**Menü Adımı:** `Satış ve Alış İşlemleri → Satış İşlemleri → Teklif`

## Ekran Tanımı

Sipariş teklif ekranıdır.

## Alan Açıklamaları

| Alan | Açıklama |
| --- | --- |
| Belge Kodu | Belge kaydedildiğinde Panorama tarafından verilen otomatik artışlı numaradır. |
| Distribütör Kodu | Belgenin hangi Distribütör için kesileceğinin tanımlandığı alandır. |
| Müşteri Kodu | Müşteri seçiminin yapıldığı alandır. Zorunlu bir alandır. |
| Satış Temsilcisi | Siparişin hangi satış temsilcisi tarafından girildiğini gösteren alandır. Yukarıda seçilen müşteri bir temsilcisinin rutuna bağlı ise müşteri seçiminden sonra Satış Temsilcisi otomatik olarak gelir. Zorunlu bir alandır. |
| Hareket Tipi | Satış Siparişi için tanımlanan hareket tipinin seçildiği alandır. Zorunlu bir alandır. |
| Depo Kodu | Sevkiyat deposunun seçildiği alandır. Default olarak distribütörün varsayılan deposu gelir fakat değiştirilebilir. Zorunlu bir alandır. |
| Matbu No | Belge yazdırıldığında oluşan matbu no kodu değerini tutar. |
| Mağaza Kod | Default olarak yukarıda seçilen satış temsilcisinin temsilci depo kodu gelir fakat değiştirilebilir. |
| Bakiye Dövizi | Belgede farklı döviz türünden ürünlerin satışının yapılması durumunda belgenin sonuç alanındaki hesaplamanın hangi döviz tipinden yapılacağının belirtildiği alandır. Rehberde para birimi tanımındaki para birimleri listelenir. |
| Döviz Kuru | Bakiye dövizi alanından farklı bir para birimi seçilmesi durumunda, ilgili para birimi için ilgili işlem tarihine ait Döviz Kuru tanımı var ise otomatik olarak kur değeri gelir, Elle de değer girilebilir. |
| İşlem Tarihi | Belgenin işlem tarihinin girildiği alandır. Default olarak günün tarihi gelir. Zorunlu bir alandır. |
| Vade Günü | Belgenin vade günü değerinin girildiği alandır. Zorunlu bir alandır. |
| Vade Tarihi | Belgenin vade tarihinin girildiği alandır. Vade günü alanına girilen değer işlem tarihine eklenerek vade tarihini oluşturur. Vade tarihine farklı bir tarih değeri girilmesi durumunda da ekranda bir alana tıkladığımızda işlem tarihine göre vade günü değeri tekrar hesaplanır. |
| Sevk Tarihi | Siparişteki ürünlerin sevk edileceği tarih bilgisi girilir. |
| Açık Kapalı | Belgenin Açık/Kapalı bilgisinin girildiği alandır. Ödemenin durumuna göre belirlenir. Ödemesi peşin alınacak ise kapalı seçilebilir. Kapalı seçilen sipariş, fatura kaydına çevrildiğinde otomatik olarak tahsilat kaydı da oluşturulur. Bu nedenle peşin alınan ya da alınması kesin belgeler için kapalı durumu seçilebilir. |
| Özel Kod | Zorunlu bir alan değildir. Özel kod değeri girilebilir. |
| Geçerlilik Tarihi | Teklifin geçerlilik tarihi bilgisidir. |
| İşlem Saati | Siparişin kaydedildiği saat bilgisini gösterir. Bu alan pasiftir değiştirilemez. |
| İmza | Mobile den girilen imzanın gösterimini yapar. |
| KDV'den Muaf | Seçilen müşteri KDV den muaf ise buradaki seçenek işaretli ve pasif gelir fakat müşteri KDV den muaf değilse buradaki seçenek işaretsiz ve aktif gelir istenirse ilgili belge için seçenek işaretlenerek KDV hesaplanmayabilir. |
| Ödeme Tipi | Ödeme tipi bilgisidir. Çek/Kredi Kartı/Açık Hesap/DBS ve Havale/EFT değerlerinden biri seçilir. Müşterinin ürün teslimi sırasında hangi ödeme tipi ile ödeyeceği bilgisidir. Bu alandaki bilgi müşteri tanım ekranındaki ödeme tipi alanından gelir ancak gelen değer istenildiğinde değiştirilebilmektedir. |
| Banka Kodu | Kredi kartı, DBS ve havale ödeme tiplerinde hangi bankaya ait olduğu bilgisinin seçileceği alandır. |
| Banka Hesap | Ödeme tipi DBS veya havale olduğunda, seçilen banka koduna ait hesap bilgisi seçilir. |
| Sevkiyat Adresi | Belgede seçilen müşteri için tanımlanan Sevk Adresleri rehberde listelenir. |
| Fatura Altı İsk 1,2,3 | İsteğe bağlı olarak dip toplamda yapılacak iskontoların girildiği alanlardır. Buraya girilen iskontolar satırlara dağıtılabilir. |
| Üretici Kodu | Üretici kodu bilgisidir. |
| Sıra | Belge detayına eklenen ürünün hangi sırada eklendiğini gösterir. |
| Ürün | Belge detayına eklenen ürünün ürün kodu değerini gösterir. |
| Depo Mik. | Ürünün belge başlığında seçilen depodaki mevcut stok miktarıdır. Stok miktarı ana birim bazında görüntülenir ancak ekrandaki birim alanından 1.birim yerine 2.birim / 3.birim / 4.birim / 5.birim gibi birimler yapıldığında depo miktarı bu birime göre gösterilecektir. |
| Miktar | Belge detayına eklenen ürünün miktar değerini gösterir. |
| Birim | Belge detayına eklenen ürünün hangi birimden eklenmiş olduğunu gösterir. |
| Birim Fiyat | Belge detayına eklenen ürünün seçilen birim bazında fiyat bilgisini gösterir. |
| Kayıt Tipi | Belge detayına eklenen ürünün ürün tipidir, fakat bu ürün promosyon olarak eklenmiş ise "P" değerini alır. |
| Brüt Tutar | Belge detayına eklenen ürünün satırdaki birim fiyat değeri ile miktar alanındaki değerin çarpımından oluşan değerdir. |
| Net Tutar | Belge detayındaki ürünün Brüt tutar değerinden var ise iskonto oranlarının düşmesi sonucu oluşan rakamdır. |
| KDV Oranı | Belge detayındaki ürünün KDV oran bilgisidir. |
| ÖTV/ÖİV | Belge detayındaki ürünün var ise ÖTV/ÖİV değerini gösterir. |
| Komisyon | Belge detayındaki ürünün Komisyon oran bilgisidir. |
| İsk1,…,İsk8 | Belge detayındaki ürünün iskonto bilgisidir. Oran ya da tutar değeri olabilir. |
| Özel Kod | Belge detayındaki ürünün Özel Kod oran bilgisidir. |
| Puan | Hediyesi puan olan bir iskonto uygulanmış ise satırdaki ürün için toplam hak edilen puan değerini gösterir. |
| Br.Net F. | Belge detayındaki ürünün en küçük birimden hesaplanan satır net tutar değeridir. |
| Tevkf | Belge detayındaki ürünün Tevkf oran bilgisidir. |
| KDVli Br.F. | Belge detayındaki ürünün KDV li birim fiyat değerini gösterir. |
| Seçimli Özel Kod | Müşterinin (Distribütörün) ürünleri talep ettiği fabrika bilgisi değeridir. |
| Nakliye Tarihi | Ürünlerin nakliye tarihini gösterir. |
| Giriş Tipi | Siparişin nereden girilmiş olduğunu belirtir. Panoramadan girilen siparişler için giriş tipi EnroutePanorama, Mobilden girilen siparişlerde giriş tipi PanoramaMobile, Ticari Paket aktarımı ile gelen siparişlerde giriş tipi Panorama Aktarım olarak görünür. |
| Belge Durumu | Siparişin durumunun ne olduğunu gösterir. Aktif, Pasif, İptal, Bloke, Silindi değerlerini alır. |
| Basım Durumu | Sipariş kaydedildiğinde basım durumu yazdırılmadı olarak görünür. Siparişi yazdırdıktan sonra basım durumu yazdırıldı olarak güncellenir. |
| Onay Durumu | Eğer Alınan Sİpariş için iş akış tanımı var ise sipariş kaydedildiğinde onay durumu onaylanmadı olarak görünür. Bu siparişin İş akış onaydan onaylanması durumunda Belgenin Onay durumu onaylandı görünür. Fakat iş akış tanımı yok ise alınan sipariş ilk kaydedildiğinde onay durumu onaylandı olarak görünür. |
| Oluşturulma Yeri | Siparişin hangi menüden oluşturulduğunun bilgisinin gösterildiği alandır. |
| Oluşturulma Tarihi | Siparişin hangi tarih ve hangi saatte oluşturulduğunun gösterildiği alandır. |
| Sipariş Kod | Şipariş kod bilgisidir. |
| Toplam Hacim/ Ağırlık | Sipariş detayındaki ürünlerin toplam Hacim ve Ağırlık bilgisi değerleridir. |
| Brüt Tutar | Siparişte yer alan ürünlerin, KDV tutarlarının toplam bilgisidir. |
| İskonto Oranı / Tutarı | Siparişin tamamına uygulanan iskontonun toplam tutarıdır. Oran ise iskonto tutarının Brüt tutara oranını gösterir. |
| ÖTV/ÖİV | Belgede uygulanmış olan ÖTV / ÖIV değeridir. |
| KDV Tutarı | Belgede yer alan ürünlerin, KDV tutarlarının toplam bilgisidir. |
| Net Tutar | Belge net tutar bilgisidir. (Brüt Tutar - İskonto Tutarı + KDV Tutarı) Formülü ile hesaplanır. |
| Dövizli Brüt Tutar | Belge detayında farklı para birimlerine ait ürünlerin eklenmesi durumunda, belgenin başlık alanında seçilen bakiye döviz alanındaki para birimi ve döviz kuruna bağlı olarak detaydaki ürünlerin toplam Brüt Tutar değerini gösterir. |
| Dövizli İskonto Tutarı | Belge detayında farklı para birimlerine ait ürünlerin eklenmesi durumunda, belgenin başlık alanında seçilen bakiye döviz alanındaki para birimi ve döviz kuruna bağlı olarak belgenin toplam iskonto tutarını gösterir. |
| Dövizli Ötv/ÖİV Tutarı | Belge detayında farklı para birimlerine ait ürünlerin eklenmesi durumunda, belgenin başlık alanında seçilen bakiye döviz alanındaki para birimi ve döviz kuruna bağlı olarak belgede uygulanmış ÖTV/ Öiv Tutarını gösterir. |
| Dövizli KDV Tutarı | Belge detayında farklı para birimlerine ait ürünlerin eklenmesi durumunda, belgenin başlık alanında seçilen bakiye döviz alanındaki para birimi ve döviz kuruna bağlı olarak Belgede yer alan ürünlerin, Kdv Tutarları bilgisini gösterir. |
| Dövizli Net Tutar | Belge detayında farklı para birimlerine ait ürünlerin eklenmesi durumunda, belgenin başlık alanında seçilen bakiye döviz alanındaki para birimi ve döviz kuruna bağlı olarak Belge Net Tutar bilgisini gösterir. |

## Buton Açıklamaları

| Alan | Açıklama |
| --- | --- |
| Hesapla | Belgenin detayları girildikten sonra kaydet demeden de hesapla butonuna tıklanarak belgenin son durumunu görebiliriz. |
| İsk/Pro. | Belgede hak edilen genel tanımlanmış ve hediyesi seçimli olan iskontoların iskonto hediye seçimi bu adımdan yapılır. |
| Ek Bilgiler | Ek bilgi ekleme ekranıdır. “Araç Kodu”, “Yol Yardım Numarası” bilgileri eklemek için kullanılır. |
| Teklif Bas | Teklifi yazdırmak için kullanılan ekrandır. |
| Kaydet | Belgeyi kaydetmek için kullanılır. |
| Kapat | Belge ekranını kapatmak için kullanılır. |
| Yenile | Belge detay listesini yenilemek için kullanılır. |
| Yeni | Belge detaya yeni ürün eklemek için kullanılır. |
| Düzenle | Belge detay satırında düzenleme yapmak için kullanılır. |
| İzle | Detaya eklenen satırı izle modunda açar. |
| Sil | Detaya eklenen satırı silmek için kullanılır. |
| İsk./ Pro. | Belge de hak edilen satır iskontosunun hediyesinin seçimli olması durumunda hediye seçimi bu alandan yapılır. |
| Hızlı Giriş | Belge detayına eklenecek ürünlerin tek bir ekrandan seçilip miktar ve birim değerlerinin hızlı bir şekilde girilmesi için Hızlı Giriş kullanılabilir. |
| Toplu Kod Girişi | Ürün barkod kodu, ürün kodu veya ağırlıklı ürün barkod girişi ile belge detayına ürün eklenebilir. |
| Ürün Sorgulama | Ürünlerin ürün kodu, grup, ek grup(Marka /Mevsim ) , Marka/ Grup ve stok durumuna göre ürünlerin hızlı bir şekilde sorgulandığı ekrandır.(Bu ekranın ile ilgili bilgiye ürün Sorgulama Ekranındaki Yardım butonundan ulaşılabilir.) |
| Ek Vade İzle | Ek vade izleme ekranıdır. |


---
_Yol: EnRoute Panorama › Satış ve Alış İşlemleri › Satış İşlemleri_
