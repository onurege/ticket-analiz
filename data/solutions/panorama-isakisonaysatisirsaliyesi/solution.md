# Satış İrsaliyesi Onay

_Kaynak: Panorama Kullanım Kılavuzu_

**Menü Adımı:** `İş Akışı → Onay İşlemleri → Satış İrsaliyesi Onaylama`

## Ekran Tanımı

Onaylanacak/Reddedilen/Onaylanan alış siparişlerinin listelendiği ekrandır. Onaylama ve red işlemi bu ekrandan yapılmaktadır.

## Alan Açıklamaları

| Alan | Açıklama |
| --- | --- |
| ALAN | AÇIKLAMALAR |
| Kullanıcı Grup | Listeleme yapılacak kullanıcı grubu seçilir. |
| Onay Bekleyenler | Sadece onay bekleyenlerin listelenmesi sağlanılır. |
| Onayladıklarım | Sadece onaylananların listelenmesi sağlanır. |
| Reddettiklerim | Sadece reddedilenlerin listelenmesi sağlanılır. |
| İşlem | İşlem tipi “Bekliyor” veya “Onay” seçilerek kriter belirlenmesi yapılıp “Kaydet” butonuna tıklanılarak işlem tipinin değiştirilmesi sağlanılır. |
| Ret Neden | Red nedini veya yeniden ele alma(revize) işlemi açıklamasıdır. |
| Belge Kodu | Belge kaydedildiğinde Panorama tarafından verilen otomatik artışlı numaradır. |
| Distribütör Kodu | Belgenin hangi Distribütör için kesileceğinin tanımlandığı alandır. |
| Müşteri Kodu | Müşteri seçiminin yapıldığı alandır. Zorunlu bir alandır. |
| Satış Temsilcisi | İrsaliyenin hangi satış temsilcisi tarafından girildiğini gösteren alandır. Yukarıda seçilen müşteri bir temsilcisinin rutuna bağlı ise müşteri seçiminden sonra Satış Temsilcisi otomatik olarak gelir. Zorunlu bir alandır. |
| Hareket Tipi | Satış İrsaliyesi için tanımlanan hareket tipinin seçildiği alandır. Zorunlu bir alandır. |
| Depo Kodu | Sevkiyat deposunun seçildiği alandır. Default olarak distribütörün varsayılan deposu gelir fakat değiştirilebilir. Zorunlu bir alandır. |
| Matbu No | Belge yazdırıldığında oluşan matbu no kodu değerini tutar. |
| Mağaza Kod | Default olarak yukarıda seçilen satış temsilcisinin temsilci depo kodu gelir fakat değiştirilebilir. |
| Bakiye Dövizi | Belgede farklı döviz türünden ürünlerin satışının yapılması durumunda belgenin sonuç alanındaki hesaplamanın hangi döviz tipinden yapılacağının belirtildiği alandır. Rehberde para birimi tanımındaki para birimleri listelenir. |
| Döviz Kuru | Bakiye dövizi alanından farklı bir para birimi seçilmesi durumunda, ilgili para birimi için ilgili işlem tarihine ait Döviz Kuru tanımı var ise otomatik olarak kur değeri gelir, Elle de değer girilebilir. |
| Ödeme Planı | Eğer sabit vade kullanılmıyor ise Ödeme Planında seçmiş olduğumuz değer Vade Günü alanına atılır. |
| Teslim Tarihi | Belgenin teslim tarihi değerini tutar. |
| İşlem Tarihi | Belgenin işlem tarihinin girildiği alandır. Default olarak günün tarihi gelir. Zorunlu bir alandır. |
| İşlem Saati | İrsaliyenin kaydedildiği saat bilgisini gösterir. Bu alan pasiftir değiştirilemez. |
| Vade Günü | Belgenin vade günü değerinin girildiği alandır. Zorunlu bir alandır. |
| Vade Tarihi | Belgenin vade tarihinin girildiği alandır. Vade günü alanına girilen değer işlem tarihine eklenerek vade tarihini oluşturur. Vade tarihine farklı bir tarih değeri girilmesi durumunda da ekranda bir alana tıkladığımızda işlem tarihine göre vade günü değeri tekrar hesaplanır. |
| Sevk Tarihi | İrsaliyedeki ürünlerin sevk edileceği tarih bilgisi girilir. |
| Açık Kapalı | Belgenin Açık/Kapalı bilgisinin girildiği alandır. Ödemenin durumuna göre belirlenir. Ödemesi peşin alınacak ise kapalı seçilebilir. Kapalı seçilen irsaliyenin otomatik olarak tahsilat kaydı da oluşturulur. Bu nedenle peşin alınan ya da alınması kesin belgeler için kapalı durumu seçilebilir. |
| Özel Kod | Zorunlu bir alan değildir. Özel kod değeri girilebilir. |
| Müşteri Sip.No | Müşteri Sipariş numarası bilgisidir. |
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
| Komisyon | Belge detayındaki ürünün komisyon değeridir. |
| İsk1,…,İsk8 | Belge detayındaki ürünün iskonto bilgisidir. Oran ya da tutar değeri olabilir. |
| Puan | Hediyesi puan olan bir iskonto uygulanmış ise satırdaki ürün için toplam hak edilen puan değerini gösterir. |
| Br.Net F. | Belge detayındaki ürünün en küçük birimden hesaplanan satır net tutar değeridir. |
| Tevkf | Kademeli KDV |
| KDVli Br.F. | Belge detayındaki ürünün KDV li birim fiyat değerini gösterir. |
| Seçimli Özel Kod | Müşterinin (Distribütörün) ürünleri talep ettiği fabrika bilgisi değeridir. |
| Nakliye Tarihi | Ürünlerin nakliye tarihini gösterir. |
| Giriş Tipi | İrsaliyenin nereden girilmiş olduğunu belirtir. Panoramadan girilen İrsaliyeler için giriş tipi EnroutePanorama, Mobilden girilen irsaliyelerde giriş tipi PanoramaMobile, Ticari Paket aktarımı ile gelen irsaliyelerde giriş tipi Panorama Aktarım olarak görünür. |
| Belge Durumu | İrsaliyenin durumunun ne olduğunu gösterir. Aktif, Pasif, İptal, Bloke, Silindi değerlerini alır. |
| Basım Durumu | İrsaliyenin kaydedildiğinde basım durumu yazdırılmadı olarak görünür. İrsaliye yazdırdıktan sonra basım durumu yazdırıldı olarak güncellenir. |
| Aktarım Durumu | İrsaliyenin Ticari pakete aktarılıp aktarılmadığı bilgisini gösterir. Ticari pakete aktarılmamış irsaliyenin aktarım durumu Aktarılmadı, Ticari Pakete aktarılmış irsaliyenin aktarım durumu Aktarıldı olarak görünür. |
| Onay Durumu | Eğer Alış İrsaliyesi için iş akış tanımı var ise irsaliye kaydedildiğinde onay durumu onaylanmadı olarak görünür. Bu irsaliyenin İş akış onaydan onaylanması durumunda Belgenin Onay durumu onaylandı görünür. Fakat iş akış tanımı yok ise alış irsaliyesi ilk kaydedildiğinde onay durumu onaylandı olarak görünür. |
| Oluşturulma Yeri | İrsaliyenin hangi menüden oluşturulduğunun bilgisinin gösterildiği alandır. |
| Oluşturulma Tarihi | İrsaliyenin hangi tarih ve hangi saatte oluşturulduğunun gösterildiği alandır. |
| Fatura Takip Kodu | İlgili İrsaliyeye bağlı fatura var ise bağlı faturanın belge kodu değeri görünür. |
| Sipariş Takip Kodu | İlgili İrsaliye bir siparişe bağlı ise bağlı olan Siparişin belge kodu değeri görünür. |
| Komisyon TL | İrsaliyede yer alan ürüne tanımlanmış Kredi kartı komisyonu tanımı var ise yapılan hesaplama sonucu belge tutarına aktarılan komisyon tutarının gösterildiği alandır.(İade belgeleri için kullanılmamaktadır.) |
| Toplam Hacim/ Ağırlık | İrsaliye detayındaki ürünlerin toplam Hacim ve Ağırlık bilgisi değerleridir. |
| Brüt Tutar | İrsaliyede yer alan ürünlerin, KDV siz tutarlarının toplam bilgisidir. |
| İskonto Oranı / Tutarı | Belgenin tamamına uygulanan iskontonun toplam tutarıdır. Oran ise iskonto tutarının Brüt tutara oranını gösterir. |
| ÖTV/ÖİV | Belgede uygulanmış olan ÖTV / ÖIV değeridir. |
| KDV Tutarı | Belgede yer alan ürünlerin, KDV tutarlarının toplam bilgisidir. |
| Net Tutar | Belge net tutar bilgisidir. (Brüt Tutar - İskonto Tutarı + KDV Tutarı) Formülü ile hesaplanır. |
| Dövizli Brüt Tutar | Belge detayında farklı para birimlerine ait ürünlerin eklenmesi durumunda, belgenin başlık alanında seçilen bakiye döviz alanındaki para birimi ve döviz kuruna bağlı olarak detaydaki ürünlerin toplam Brüt Tutar değerini gösterir. |
| Dövizli İskonto Tutarı | Belge detayında farklı para birimlerine ait ürünlerin eklenmesi durumunda, belgenin başlık alanında seçilen bakiye döviz alanındaki para birimi ve döviz kuruna bağlı olarak belgenin toplam iskonto tutarını gösterir. |
| Dövizli Ötv/ÖİV Tutarı | Belge detayında farklı para birimlerine ait ürünlerin eklenmesi durumunda, belgenin başlık alanında seçilen bakiye döviz alanındaki para birimi ve döviz kuruna bağlı olarak belgede uygulanmış ÖTV/ Öiv Tutarını gösterir. |
| Dövizli KDV Tutarı | Belge detayında farklı para birimlerine ait ürünlerin eklenmesi durumunda, belgenin başlık alanında seçilen bakiye döviz alanındaki para birimi ve döviz kuruna bağlı olarak Belgede yer alan ürünlerin, Kdv Tutarları bilgisini gösterir. |
| Dövizli Net Tutar | Belge detayında farklı para birimlerine ait ürünlerin eklenmesi durumunda, belgenin başlık alanında seçilen bakiye döviz alanındaki para birimi ve döviz kuruna bağlı olarak Belge Net Tutar bilgisini gösterir. |
| Kod | Girilen tahsilatın kodunu gösterir |
| Yıl | Girilen tahsilatın yıl değerini gösterir. |
| Tip | Girilen tahsilatın Tipini gösterir.(Nakit, Kredi Kartı gibi ) |
| Tutar | Girilen tahsilatın tutar değerini gösterir. |
| Belge No | Girilen tahsilatın Belge No değerini gösterir. |
| Makbuz No | Girilen tahsilatın Makbuz No değerini gösterir |
| Vade Tarihi | Girilen tahsilatın Vade tarihi değerini gösterir. |
| Ödeme Tarihi | Girilen tahsilatın Ödeme Tarihi değerini gösterir. |
| Banka | Girilen tahsilatın tipine göre banka değeri girilmiş ise banka bilgisini gösterir. |
| Şube | Girilen tahsilatın tipine göre şube değeri girilmiş ise şube bilgisini gösterir. |
| Çek No | Girilen tahsilatın tipine göre çek no değeri girilmiş ise çek no bilgisini gösterir. |

## Buton Açıklamaları

| Alan | Açıklama |
| --- | --- |
| ALAN | AÇIKLAMALAR |
| Kaydet | Yapılan değişikliklerin kaydedilmesini sağlar. |
| İzle | Tanımın izle ile açılmasını sağlar. |
| Tarihçe | Onay geçmişini gösterir. |
| Düzenle | İzin verilen yetki dahilinde belgenin düzenleme butonudur. |
| Başlık Düzenle | Matbu No, Özel Kod, Açıklama sahalarının düzenlenmesi sağlanır. |
| Kapat | Ekranı kaydetmeden kapatır. |
| Ret Neden | Ret Nedenin kod bilgisidir. |
| Geri Gelme Nedeni | Onay Kod bilgisidir. |
| Kod | Oluşturan Kişi bilgisidir. |
| Erp Kod | Erp kodu bilgisidir. |
| Ünvan | Panoramada tanımlı Müşteri Unvan bilgisidir. |
| Tutar | Satış Tutar bilgisidir. |
| İşlem Tarihi | Belgenin İşlem Tarihinin görüldüğü ekrandır. |
| Distribütör Kodu | Distiribütör Kod bilgisidir. |
| Dist | Distiribütör Açıklama bilgisidir. |
| Yıl | İrsaliye Faturası gerçekleştiği yıl alanıdır. |
| İşlem Tarihi | Satış irsaliyesi işlem tarihi |
| Yükleme | İrsaliyenin daha önceden oluşturulmuş bir yüklemeye dahil edilmesinin istenmesi durumunda Yükleme butonundan işlem yapılır. |
| Tahsilat | İrsaliyeye ait tahsilat girişi yapılır. |
| Belge Toplama | Belgedeki ürünlerin Depocuya gönderilip, depocu tarafından toplanılması gerekiyor ise belge toplama butonundan işlem yapılır. |
| Araç Takas | Araç Takas ekranı. |
| Uygulanmış İsk/Pro. | Belgede hak edilen genel tanımlanmış ve hediyesi seçimli olan iskontoların iskonto hediye seçimi bu adımdan yapılır. |
| Cari Bakiye | Belgede seçilen müşterinin Cari Bakiyesini Görmek için Cari bakiye butonu kullanılır. |
| Parçalı Vade | Parçalı vade girişi bu adımdan yapılır. |
| Kapat | Belge ekranını kapatmak için kullanılır. |
| Yenile | Belge detay listesini yenilemek için kullanılır. |
| İzle | Detaya eklenen satırı izle modunda açar. |
| Tp. Br. Miktar | Belge detayında toplu olarak birimlerin miktarını gösterir.(ürünlerin aynı olma durumu gözetilmez.) |
| Yükleme Kodu | Kaydedilen Satış İrsaliyesi herhangi bir yüklemeye dahil değil ise ve herhangi bir yüklemeye dahil edilmen isteniyor ise Yükleme kodu alanından hangi yüklemeye dahil edileceği seçilir. |
| Yükleme Detay Kod | Satış İrsaliyesinin dahil edileceği yükleme kodu seçildikten sonra bu yüklemedeki hangi araca dahil edileceği Yükleme Detay Kodu alanından seçilir. |
| Yenile | Tahsilat detay alanındaki listenin yenilenmesi için kullanılan butondur. |
| İzle | Detayda listelenen tahsilatı izle modunda açar. |
| Kapat | Tahsilat ekranını kapatmak için kullanılır. |
| Müşteri Kodu | Belge üzerindeki müşterinin kodunu gösterir. |
| Müşteri Ünvanı | Belge üzerindeki müşterinin ünvanını gösterir. |
| Yıl | Aktif yıl değerini gösterir. |
| Ciro | Müşterinin Ciro değerini gösterir. |
| Borç | Müşterinin Borç bakiyesini gösterir. |
| Alacak | Müşterinin Alacak bakiyesini gösterir. |
| Bakiye | Müşterinin toplam bakiyesini gösterir. |
| Riskli Bakiye | Müşterinin Riskli bakiyesini gösterir. |


---
_Yol: EnRoute Panorama › İş Akış › Onay İşlemi_
