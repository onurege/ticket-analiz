# İrsaliye

_Kaynak: Panorama Kullanım Kılavuzu_

**Menü Adımı:** `Satış ve Alış İşlemleri → Satış İşlemleri → İrsaliye`

## Ekran Tanımı

Satış İrsaliyeleri bu ekrandan girilir. Öncelikle ekrana, sisteme daha önceden girilmiş olan Satış İrsaliyeleri listelenir.

## Alan Açıklamaları

| Alan | Açıklama |
| --- | --- |
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
| İmza | Mobile den girilen imzanın gösterimini yapar. |
| KDV'den Muaf | Seçilen müşteri KDV den muaf ise buradaki seçenek işaretli ve pasif gelir fakat müşteri KDV den muaf değilse buradaki seçenek işaretsiz ve aktif gelir istenirse ilgili belge için seçenek işaretlenerek KDV hesaplanmayabilir. |
| Ödeme Tipi | Ödeme tipi bilgisidir. Çek/Kredi Kartı/Açık Hesap/DBS ve Havale/EFT değerlerinden biri seçilir. Müşterinin ürün teslimi sırasında hangi ödeme tipi ile ödeyeceği bilgisidir. Bu alandaki bilgi müşteri tanım ekranındaki ödeme tipi alanından gelir ancak gelen değer istenildiğinde değiştirilebilmektedir. |
| Banka Kodu | Kredi kartı, DBS ve havale ödeme tiplerinde hangi bankaya ait olduğu bilgisinin seçileceği alandır. |
| Banka Hesap | Ödeme tipi DBS veya havale olduğunda, seçilen banka koduna ait hesap bilgisi seçilir. |
| Sevkiyat Adresi | Belgede seçilen müşteri için tanımlanan Sevk Adresleri rehberde listelenir. |
| Fatura Altı İsk 1,2,3 | İsteğe bağlı olarak dip toplamda yapılacak iskontoların girildiği alanlardır. Buraya girilen iskontolar satırlara dağıtılabilir. |
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
| Onay Durumu | Eğer Satış İrsaliyesi için iş akış tanımı var ise irsaliye kaydedildiğinde onay durumu onaylanmadı olarak görünür. Bu irsaliyenin İş akış onaydan onaylanması durumunda Belgenin Onay durumu onaylandı görünür. Fakat iş akış tanımı yok ise satış irsaliyesi ilk kaydedildiğinde onay durumu onaylandı olarak görünür. |
| Yükleme Kod / Plaka | İrsaliyenin yüklemesi yapılmış ise bu alanda yükleme kodu ve yüklemedeki dağıtıcının plaka kodu bilgisi görünür. |
| Oluşturulma Yeri | İrsaliyenin hangi menüden oluşturulduğunun bilgisinin gösterildiği alandır. |
| Oluşturulma Tarihi | İrsaliyenin hangi tarih ve hangi saatte oluşturulduğunun gösterildiği alandır. |
| Fatura Takip Kodu | İlgili İrsaliyeye bağlı fatura var ise bağlı faturanın belge kodu değeri görünür. |
| Sipariş Takip Kodu | İlgili İrsaliye bir siparişe bağlı ise bağlı olan Siparişin belge kodu değeri görünür. |
| Komisyon TL | İrsaliyede yer alan ürüne tanımlanmış Kredi kartı komisyonu tanımı var ise yapılan hesaplama sonucu fatura tutarına aktarılan komisyon tutarının gösterildiği alandır.(İade belgeleri için kullanılmamaktadır.) |
| Toplam Hacim/ Ağırlık | İrsaliye detayındaki ürünlerin toplam Hacim ve Ağırlık bilgisi değerleridir. |
| Toplama Durumu | Mobilden girilen irsaliye depocu terminaline düşüyor ve depocu tarafından yapılan işlem sonucu ile ilgili bilgi bu alandan görülür. |
| Brüt Tutar | İrsaliyede yer alan ürünlerin, KDV tutarlarının toplam bilgisidir. |
| İskonto Oranı / Tutarı | Belgenin tamamına uygulanan iskontonun toplam tutarıdır. Oran ise iskonto tutarının Brüt tutara oranını gösterir. |
| ÖTV/ÖİV | Belgede uygulanmış olan ÖTV / ÖIV değeridir. |
| KDV Tutarı | Belgede yer alan ürünlerin, KDV tutarlarının toplam bilgisidir. |
| Net Tutar | Belge net tutar bilgisidir. (Brüt Tutar - İskonto Tutarı + KDV Tutarı) Formülü ile hesaplanır. |
| Dövizli Brüt Tutar | Belge detayında farklı para birimlerine ait ürünlerin eklenmesi durumunda, belgenin başlık alanında seçilen bakiye döviz alanındaki para birimi ve döviz kuruna bağlı olarak detaydaki ürünlerin toplam Brüt Tutar değerini gösterir. |
| Dövizli İskonto Tutarı | Belge detayında farklı para birimlerine ait ürünlerin eklenmesi durumunda, belgenin başlık alanında seçilen bakiye döviz alanındaki para birimi ve döviz kuruna bağlı olarak belgenin toplam iskonto tutarını gösterir. |
| Dövizli Ötv/ÖİV Tutarı | Belge detayında farklı para birimlerine ait ürünlerin eklenmesi durumunda, belgenin başlık alanında seçilen bakiye döviz alanındaki para birimi ve döviz kuruna bağlı olarak belgede uygulanmış ÖTV/ Öiv Tutarını gösterir. |
| Dövizli KDV Tutarı | Belge detayında farklı para birimlerine ait ürünlerin eklenmesi durumunda, belgenin başlık alanında seçilen bakiye döviz alanındaki para birimi ve döviz kuruna bağlı olarak Belgede yer alan ürünlerin, Kdv Tutarları bilgisini gösterir. |
| Dövizli Net Tutar | Belge detayında farklı para birimlerine ait ürünlerin eklenmesi durumunda, belgenin başlık alanında seçilen bakiye döviz alanındaki para birimi ve döviz kuruna bağlı olarak Belge Net Tutar bilgisini gösterir. |
| Yükleme Kodu | Kaydedilen Satış İrsaliyesi herhangi bir yüklemeye dahil değil ise ve herhangi bir yüklemeye dahil edilmen isteniyor ise Yükleme kodu alanından hangi yüklemeye dahil edileceği seçilir. |
| Yükleme Detay Kod | Satış İrsaliyesinin dahil edileceği yükleme kodu seçildikten sonra bu yüklemedeki hangi araca dahil edileceği Yükleme Detay Kodu alanından seçilir. |
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
| Depocuya Gönder | İrsaliyede ki ürünlerin depocu tarafından toplanıp onaylanması için bu parametre işaretlenir. |
| Kısmi Toplama | İrsaliyedeki ürünlerin kısmi olarak toplanması için bu parametre işaretlenir. |
| Kazanılan Puan | İlgili müşterinin Kazanmış olduğu Sadakat puanını değerini gösterir. |
| Tutar Karşılığı | Kazanılan Puan değeri ile Sadakat Hedef tanımındaki değer alanındaki değer çarpımından oluşan değerdir. |
| Kullanım Yüzdesi | İlgili Sadakat Hedef tanımındaki Kullanım Yüzdesi değerini gösterir. |
| Dağıtılacak Satır Toplamı | İlgili belgede sadakat iskontosunun uygulanacağı satırların toplamını gösterir. |
| Maksimum Sadakat Tutarı | İlgili belgede Dağıtılacak Satır Toplamı alanındaki değerin, Sadakat hedef tanımındaki Kullanım yüzdesine oranlanması ile bulunan değerdir ve bu belge için maksimum uygulanacak sadakat değerini gösterir. |
| Sadakat Tutarı | Bu belge için uygulanmasını istediğimiz sadakat tutarı değerini gireriz değer TL olarak girilir ve max. Sadakat tutarı alanındaki değerden büyük değer girilemez. |
| ISK/PRO Bilgileri | Hak edilen ve belgede uygulanacak iskonto ve bu iskontoya bağlı hak edilen hediye seçimleri listelenir. |
| Hediye Bilgileri - Miktar | İskonto bilgileri alanında seçilen hediyenin ilgili belgede ne kadar kazanıldığının bilgisi yer alır. |
| Hediye Bilgileri - Seçilen Miktar | İskonto bilgileri alanında seçilen hediyenin türü ürün grup, ürün ek grup, ürün dinamik grup olması durumunda ekranında sağ tarafında ürünlerin listelendiğini görürüz ve seçmiş olduğumuz ürünlere girilen değerlerin toplamı seçilen miktar alanında görünür. |
| Ürün | İskonto bilgileri alanında seçilen hediyenin türü ürün grup, ürün ek grup, ürün dinamik grup olması durumunda listelenen ürünün ürün kodunu gösterir. |
| Ad | İskonto bilgileri alanında seçilen hediyenin türü ürün grup, ürün ek grup, ürün dinamik grup olması durumunda listelenen ürünün adını gösterir. |
| Miktar | İskonto bilgileri alanında seçilen hediyenin türü ürün grup, ürün ek grup, ürün dinamik grup olması durumunda listelenen ürünün hediye için verilmesini istediğimiz değeri gösterir. |
| Ürün Birimi | İskonto bilgileri alanında seçilen hediyenin türü ürün grup, ürün ek grup, ürün dinamik grup olması durumunda, iskonto tanımında hediye alanında ilgili hediyenin ürünü için seçilen birim sıradaki birim değerini gösterir. |
| Depo Miktarı | İskonto bilgileri alanında seçilen hediyenin türü ürün grup, ürün ek grup, ürün dinamik grup olması durumunda listelenen ürünün bu belgede seçilen depoya ait depo miktarını gösterir. |
| Müşteri Kodu | Belge üzerindeki müşterinin kodunu gösterir. |
| Müşteri Ünvanı | Belge üzerindeki müşterinin ünvanını gösterir. |
| Yıl | Aktif yıl değerini gösterir. |
| Ciro | Müşterinin Ciro değerini gösterir. |
| Borç | Müşterinin Borç bakiyesini gösterir. |
| Alacak | Müşterinin Alacak bakiyesini gösterir. |
| Bakiye | Müşterinin toplam bakiyesini gösterir. |
| Riskli Bakiye | Müşterinin Riskli bakiyesini gösterir. |
| Müşteri Kodu | Belge üzerindeki müşterinin kodunu gösterir. |
| Müşteri Ünvanı | Belge üzerindeki müşterinin ünvanını gösterir. |
| Ürün | Belge detayına eklenecek ürün rehberden seçilir. |
| Depo Mik. | Seçilen ürünün belgede seçilen depodaki miktarını gösterir. |
| Miktar | Seçilen ürünün miktarı girilir. |
| Birim | Seçilen ürün için girilen miktarın hangi birimden verildiği seçilir. Ürün tanımdaki birimler listelenir. |
| Birim Fiyat | Seçilen ürünün seçilen birim bazında fiyatını gösterir. |
| 1.Brm Mik. | Seçilen ürünün seçilen birim miktarının, ürünün birinci birim bazındaki değerini gösterir. |
| Kayıt Tipi | Ürünün kayıt tipini gösterir. Örneğin normal ürün U, Promosyon ürün P gibi. |
| Net Tutar | (birim fiyat * miktar ) değerinden iskontoların düşülmesi ile elde edilen rakamdır. |
| Kdv Oranı | Ürün için belirlenmiş KDV oranını gösterir. |
| Döviz Tipi | Yerel Para birimden farklı bir para birimine ait ürün satışı yapılması durumunda Döviz tipi alanından hangi para birimine ait satış yapılacağı seçilir. |
| Döviz Kuru | Seçilen Döviz Tipine ait döviz kuru seçilir. |
| Döviz fiyatı | Dövizli fiyat alanıdır. |
| Ürün Tipi | Detayda seçilmiş olan ürünün tipi otomatik olarak gelir. |
| KDV li Br. F. | Detaydaki birim fiyat alanındaki değere ürünün KDV değerinin eklenmesi ile oluşan değerdir. |
| Br.Net F. | Ürünün en küçük birimine ait fiyatın iskonto ürün için varsa iskonto düşülmüş rakamını gösterir. |
| İsk1 | Ürün için uygulanan uygulanacak iskonto bilgisidir. Oran ya da tutar değeri olabilir. |
| İsk2 | Ürün için uygulanan uygulanacak iskonto bilgisidir. Oran ya da tutar değeri olabilir. |
| İsk3 | Ürün için uygulanan uygulanacak iskonto bilgisidir. Oran ya da tutar değeri olabilir. |
| İsk4 | Ürün için uygulanan uygulanacak iskonto bilgisidir. Oran ya da tutar değeri olabilir. |
| isk5 | Ürün için uygulanan uygulanacak iskonto bilgisidir. Oran ya da tutar değeri olabilir. |
| isk6 | Ürün için uygulanan uygulanacak iskonto bilgisidir. Oran ya da tutar değeri olabilir. |
| isk7 | Ürün için uygulanan uygulanacak iskonto bilgisidir. Oran ya da tutar değeri olabilir. |
| isk8 | Ürün için uygulanan uygulanacak iskonto bilgisidir. Oran ya da tutar değeri olabilir. |
| ISK/PRO Bilgileri | Hak edilen ve belgede uygulanacak iskonto ve bu iskontoya bağlı hak edilen hediye seçimleri listelenir. |
| Hediye Bilgileri - Miktar | İskonto bilgileri alanında seçilen hediyenin ilgili belgede ne kadar kazanıldığının bilgisi yer alır. |
| Hediye Bilgileri - Seçilen Miktar | İskonto bilgileri alanında seçilen hediyenin türü ürün grup, ürün ek grup, ürün dinamik grup olması durumunda ekranında sağ tarafında ürünlerin listelendiğini görürüz ve seçmiş olduğumuz ürünlere girilen değerlerin toplamı seçilen miktar alanında görünür. |
| Ürün | İskonto bilgileri alanında seçilen hediyenin türü ürün grup, ürün ek grup, ürün dinamik grup olması durumunda listelenen ürünün ürün kodunu gösterir. |
| Ad | İskonto bilgileri alanında seçilen hediyenin türü ürün grup, ürün ek grup, ürün dinamik grup olması durumunda listelenen ürünün adını gösterir. |
| Miktar | İskonto bilgileri alanında seçilen hediyenin türü ürün grup, ürün ek grup, ürün dinamik grup olması durumunda listelenen ürünün hediye için verilmesini istediğimiz değeri gösterir. |
| Ürün Birimi | İskonto bilgileri alanında seçilen hediyenin türü ürün grup, ürün ek grup, ürün dinamik grup olması durumunda, iskonto tanımında hediye alanında ilgili hediyenin ürünü için seçilen birim sıradaki birim değerini gösterir. |
| Depo Miktarı | İskonto bilgileri alanında seçilen hediyenin türü ürün grup, ürün ek grup, ürün dinamik grup olması durumunda listelenen ürünün belgede seçilen depoya ait depo miktarını gösterir. |
| Kriterler - Ürün Grup | Hızlı giriş ürün listesinde, Ürün Grup seçimi yapılarak sadece seçilen ürün gruplarına bağlı ürünlerin listelenmesi için kullanılır. |
| Kriterler - Ürün Ek Grup | Hızlı giriş ürün listesinde, Ürün Ek Grup seçimi yapılarak sadece seçilen ürün ek gruplarına bağlı ürünlerin listelenmesi için kullanılır. |
| Kriterler - Ürün Seviyeli Grup 1 | Hızlı giriş ürün listesinde, Ürün Seviyeli Grup 1 seçimi yapılarak sadece seçilen Ürün Seviyeli Grup 1’e bağlı ürünlerin listelenmesi için kullanılır. |
| Takip Kod | Listelenen ürünlerin takip kodlarını gösterir. |
| Ürün Adı | Listelenen ürünlerin Adını gösterir. |
| Ürün Kodu | Listelenen ürünlerin Ürün Kodunu gösterir. |
| Miktar | Default değeri 0 'dır. İlgili ürünün belge detayına eklenmesini istiyorsak miktar değeri girilmelidir. |
| Birim | Belge detayına eklenmesi için girilen miktar değerinin hangi birimden girileceğinin belirleneceği alandır. |
| Özel Kod | Listelenen ürünlerin Özel Kod değerini gösterir. |
| Depo Miktarı | Listelenen ürünlerin belgedeki depoya ait miktar değerini gösterir. |
| Verilen Sipariş | Listelenen ürünlerin Verilen Sipariş değerini gösterir. |
| Bekleyen Sipariş | Listelenen ürünlerin Bekleyen Sipariş değerini gösterir. |
| Barkod Girişi | Belge detayına eklenecek ürün toplu kod girişi ekranından ürün barkod koduna göre aratılıp eklenmek isteniyor ise Barkod Girişi Seçeneği işaretlenerek Kod araması yapılır. |
| Ürün Kod Girişi | Belge detayına eklenecek ürün toplu kod girişi ekranından ürün koduna göre aratılıp eklenmek isteniyor ise Ürün Kod Girişi Seçeneği işaretlenerek Kod araması yapılır. |
| Ağırlıklı Ürün Barkod Girişi | Belge detayına eklenecek ürün toplu kod girişi ekranından Ağırlıklı Ürün Barkod değerine göre aratılıp eklenmek isteniyor ise Ağırlıklı Ürün Barkod Kod Girişi Seçeneği işaretlenerek Kod araması yapılır. |
| Kod | Ürünün Barkod değeri, Ürün Kod değeri veya Ağırlıklı Ürün Barkod değerlerinden hangisine göre arama yapılıp eklenmesini istiyor isek yukarıdaki 3 seçenekten biri işaretlendikten sonra ilgili değer bu alana girilir. |
| Seri No | Seçilen ürün serili ürün ise seri numarası değeri bu alana girildikten sonra detaya eklenir. |
| İade Nedeni | İade belgeleri için iade neden seçimi bu alandan yapılır. |
| Miktar | Giriş Tipi ve Kod değeri yapılan ürünün belgeye ne kadar ekleneceğine ait miktar değeri girilir. |
| Birim | İlgili Ürünün Birim değeri seçilir. |
| Ekle/ Çıkar Butonu | Kod değeri ve miktar değerleri girilen ürünü detaya eklemek İçin Ekle/ Çıkar Butonuna tıklanır. |
| Kaydet ve Kapat | Toplu Kod Girişi detayına eklenen ürünün belge detayına eklenmesi için Kaydet Ve Kapat butonuna tıklanır. |

## Buton Açıklamaları

| Alan | Açıklama |
| --- | --- |
| Yükleme | İrsaliyenin daha önceden oluşturulmuş bir yüklemeye dahil edilmesinin istenmesi durumunda Yükleme butonundan işlem yapılır. |
| Tahsilat | İrsaliyeye ait tahsilat girişi yapılır. |
| Belge Toplama | Belgedeki ürünlerin Depocuya gönderilip, depocu tarafından toplanılması gerekiyor ise belge toplama butonundan işlem yapılır. |
| Sadakat | Sadakat harcaması bu adımdan yapılır. |
| Hesapla | Belgenin detayları girildikten sonra kaydet demeden de hesapla butonuna tıklanarak belgenin son durumunu görebiliriz. |
| Kota | Müşterinin Kota bilgisine ulaşılır. |
| İsk/Pro. | Belgede hak edilen genel tanımlanmış ve hediyesi seçimli olan iskontoların iskonto hediye seçimi bu adımdan yapılır. |
| Cari Bakiye | Belgede seçilen müşterinin Cari Bakiyesini Görmek için Cari bakiye butonu kullanılır. |
| Parçalı Vade | Parçalı vade girişi bu adımdan yapılır. |
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
| İade Depo Ürünleri | Belgenin Depo kodu alanında herhangi bir iade depo kodunun seçilmesi durumunda detayda İade Depo ürünleri butonuna tıkladığımızda seçilmiş olan iade deposundaki ürünler belge detayına otomatik olarak eklenir. Ürünlerin eklenebilmesi için belgede iade depo seçilmesi gerekiyor. |
| Tp. Br. Miktar | Belge detayında toplu olarak birimlerin miktarını gösterir.(ürünlerin aynı olma durumu gözetilmez.) |
| Kaydet | Yükleme işleminin tamamlanması için Kaydet butonuna basılır. |
| Kapat | Yükleme Ekranını Kapatmak için Kapat butonuna basılır. |
| Yenile | Tahsilat detay alanındaki listenin yenilenmesi için kullanılan butondur. |
| Yeni | Yeni tahsilat girişi için kullanılan butondur. |
| Düzenle | Detayda listelenen tahsilat üzerinde değişiklik yapılacak ise düzenle butonuna tıklanarak tahsilat üzerinde değişiklik yapılır. |
| İzle | Detayda listelenen tahsilatı izle modunda açar. |
| Sil | Detayda listelenen Tahsilatı silmek istediğimizde Sil butonuna tıklanır. |
| Kapat | Tahsilat ekranını kapatmak için kullanılır. |
| Tutar | Tahsilatın tutar değeri girilir. |
| Makbuz No | Tahsilatın Makbuz No değeri girilir. |
| Belge No | Tahsilatın belge no değeri girilir. |
| Çek No | Tahsilatın tipine göre çek no değeri girilir. |
| Tip | Tahsilatın Tipi seçilir.(Nakit, Kredi Kartı gibi ) |
| Vade Tarihi | Tahsilatın Vade tarihi değeri girilir. |
| Ödeme Tarihi | Tahsilatın Ödeme Tarihi değeri girilir. |
| Banka | Tahsilatın tipine göre banka bilgisi girilir. |
| Şube | Tahsilatın tipine göre şube bilgisi girilir. |
| İşlem Tipi | Tahsilatın tipine göre İşlem tipi değerleri listelenir ve buradan tahsilatın işlem tipi değeri seçilir. |
| Yenile | Sadakat listesini yenilemek için kullanılır. |
| Düzenle | Düzenle butonuna bastığımızda Sadakat Tutar alanına değer girebilmemiz için editör ekranı açılır. |
| İzle | Girilen Sadakat tutarı alanındaki değeri gösterir. |
| Kapat | Sadakat iskontosu seçim ekranını kapatır. |
| Uygulamadan Geç | Sadakat iskontosunun uygulanmasını istemiyorsak Uygulamadan Geç butonuna tıklamalıyız. |
| Kota Bilgisi | Kota bilgisi değeridir. |
| Kriter Tipi | Kota tanımındaki Kriter Tip değerini gösterir. |
| Kriter Kodu | Kota tanımındaki Kriter Kodu değerini gösterir. |
| Kriter Adı | Kota tanımındaki Kriter Adı değerini gösterir. |
| Hedef Tipi | Kota tanımındaki Hedef Tipi değerini gösterir. |
| Günlük Hedef | Kota tanımındaki Günlük Hedef değerini gösterir. |
| Gerçek. Gün. | Müşterinin Geçekleşen günlük kota değerini gösterir. |
| Haftalık Hedef | Kota tanımındaki Haftalık Hedef değerini gösterir. |
| Gerçek. Hafta | Müşterinin Geçekleşen haftalık kota değerini gösterir. |
| Aylık Hedef | Kota tanımındaki Aylık Hedef değerini gösterir. |
| Gerçek Ay | Müşterinin Geçekleşen aylık kota değerini gösterir. |
| Yenile | Ürün listesini yenilemek için kullanılır. |
| Düzenle | Düzenle butonuna bastığımızda İlgili ürün için promosyon miktarı değeri girilir. |
| İzle | Girilen miktar alanındaki değeri gösterir. |
| Kapat | iskonto Promosyon Seçim ekranını kapatır. |


---
_Yol: EnRoute Panorama › Satış ve Alış İşlemleri › Satış İşlemleri_
