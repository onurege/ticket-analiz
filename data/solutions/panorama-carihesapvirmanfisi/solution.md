# Cari Hesap Virman Fişi

_Kaynak: Panorama Kullanım Kılavuzu_

**Menü Adımı:** `Finans İşlemleri → Tahsilat İşlemleri → Cari Hesap Virman Fişi`

## Ekran Tanımı

Car hesaba virman işleminin yapıldığı adımdır. Ekrana daha önceden girilmiş olan Cari Hesap Virman Fişi kayıtları gelir. Önceki girilen virman fişi kayıtları üzerinde iptal, düzenleme işlemi yapılabilir.

## Alan Açıklamaları

| Alan | Açıklama |
| --- | --- |
| Kod | Virman fişine program tarafından verilen artışlı numaradır. |
| İşlem Tarihi | Virman fişinin yapıldığı tarih bilgisinin girildiği alandır. |
| Durum | Virman kaydının belge durum bilgisidir. Aktif, pasif değerlerini alır. |
| Distribütör Kodu | Distribütör bilgisinin girildiği alandır. |
| Hareket Tipi | Rehber alanıdır ,üst satırda seçilmiş olan distribütör için tanımlanmış bakiye dengeleme işlem tipleri. Hareket tipi alanı zorunlu alandır. |
| Satış Temsilcisi | Distribütör kodu alanında seçilen distribütöre ait satış temsilcisi tanımları listelenir. Satış temsilcisi zorunlu alandır . |
| Matbu No | Basım işleminden sonra virman fişinin matbu numarası ekrana gelen Seri + Matbu Numarası değeri ile güncellenir.Zorunlu değildir ve yazdırılmadan da elle değer girilebilir. |
| Döviz Tipi | Yeni tanımda bu alan default olarak boş gelir. Detayda farklı döviz tiplerine ait satır girlmesi durumunda bu alana değer girlmesi gerekmektedir. Döviz Tipi alanında yerel para birimi haricindeki para birimi tanımlarının simgeleri gösterilir. |
| Döviz Kuru | Döviz Tipinin seçilmesi durumunda seçilen döviz tipine ait ekranın başlık kısmındaki işlem tarihine ait döviz kuru var ise otomatik olarak 1. tür kur değeri gelir. Kur bilgisini elle veya diğer kur türlerinden biriyle değiştirebiliriz. Döviz tipinin seçilmesi durumunda kur bilgisinin girilmesi gerekmektedir. Döviz Tipi Girilmeden kur alanına manuel olarak değer girilmesi durumunda ise “Döviz Seçimi Yapınız” şeklinde uyarı gelir . |
| Müşteri Kodu | Başlık alanında seçili olan distribütöre ait müşterilerin listelendiği ve seçildiği zorunlu alandır. |
| Borç | Borç değerinin girileceği alandır. Borç alanına değer girildikten sonra Alacak alanlarından alacak alanına da değer girlmesi durumunda satır kaydedilmez. Her iki alandan sadece bir tanesinde değer olmalı. |
| Alacak | Alacak değerinin girileceği alandır. Borç alanına değer girildikten sonra Alacak alanlarından alacak alanına da değer girlmesi durumunda satır kaydedilmez. Her iki alandan sadece bir tanesinde değer olmalı. |
| Makbuz No | Makbuz no’nun girildiği ve girilmesinin zorunlu olduğu alandır. |
| Döviz Tipi | Yeni tanımda bu alan default oalrak boş gelir. Dövizli giriş yapılması durumunda bu alanda seçim yapılmalı. Döviz Tipi alanında yerel para birimi haricindeki para birimi tanımlarının simgeleri gösterilir. |
| Döviz Kuru | Döviz Tipinin seçilmesi durumunda seçilen döviz tipine ait ekranın başlık kısmındaki işlem tarihine ait döviz kuru var ise otomatik olarak bu 1. tür kur değeri gelir. Kur bilgisini elle veya diğer kur türlerinden biriyle değiştirebiliriz. Döviz tipinin seçilmesi durumunda kur bilgisinin girilmesi gerekmektedir, girilmemesi durumunda “Lütfen kur bilgisi giriniz” şeklinde uyarı gelir. Döviz Tipi Girilmeden kur alanına manuel olarak değer girilmesi durumunda ise “Döviz Seçimi Yapınız” şeklinde uyarı gelir . |
| Dövizli Borç | Döviz tipi ve buna bağlı olarak Döviz kuru değeri girildikten sonra Dövizli borç sahasına değer girilmesiyle dövizli borç ve kur bilgisinin çarpımı otomatik olarak Borç sahasına set edilir. Borç Sahasına değer girildikten sonra Döviz tipi ve buna bağlı olarak Döviz kuru değerinin girilmesi durumunda ise otomatik olarak Borç değerinin kur değerine bölünmesi ile Dövizli Borç değeri set edilir. |
| Dövizli Alacak | Döviz tipi ve buna bağlı olarak Döviz kuru değeri girildikten sonra Dövizli Alacak sahasına değer girilmesiyle dövizli Alacak ve kur bilgisinin çarpımı otomatik olarak Alacak sahasına set edilir. Alacak Sahasına değer girildikten sonra Döviz tipi ve buna bağlı olarak Döviz kuru değerinin girilmesi durumunda ise otomatik olarak Alacak değerinin kur değerine bölünmesi ile Dövizli Alacak değeri set edilir. |
| Döviz Kuru | Döviz Tipinin seçilmesi durumunda seçilen döviz tipine ait ekranın başlık kısmındaki işlem tarihine ait döviz kuru var ise otomatik olarak 1. tür kur değeri gelir. Kur bilgisini elle veya diğer kur türlerinden biriyle değiştirebiliriz. Döviz tipinin seçilmesi durumunda kur bilgisinin girilmesi gerekmektedir. Döviz Tipi Girilmeden kur alanına manuel olarak değer girilmesi durumunda ise “Döviz Seçimi Yapınız” şeklinde uyarı gelir . |
| Belge Durum | Virman fişinin aktif veya pasif olma durumunu gösterir. |
| Belge Basım Durumu | Virman fişinin yazdırılması durumunda Basım Durumu yazdırıldı olarak set edilir. Default olarak yazdırılmadı olarak görünür . |
| Aktarım Durumu | Virman fişinin Ticari Pakete aktarılması durumunda Aktarım Durumu aktarıldı olarak set edilir . Default olarak aktarılmadı olarak görünür. |
| Borç Toplamı | Virman Fişi Detay alanında girilen Borç satırlarına ait kayıtların Borç alanlarındaki değerlerin toplamını gösterir . |
| Alacak Toplamı | Virman Fişi Detay alanında girilen Alacak satırlarına ait kayıtların Alacak alanlarındaki değerlerin toplamını gösterir . |
| Dövizli Borç Toplamı | Virman Fişi Detayında Dövili Borç satırı var ise bu satırlardaki Dövizli Borç değerilerinin toplamını gösterir |
| Dövizli Alacak Toplamı | Virman Fişi Detayında Dövili Alacak satırı var ise bu satırlardaki Dövizli Alacak değerilerinin toplamını gösterir |
| Bakiye | Borç Toplamı – Alacak Toplamı değerini gösterir. Bu değerin sıfırdan farklı olması durumunda Virman Fişi Tanımı kaydedilmeyecektir |

## Buton Açıklamaları

| Alan | Açıklama |
| --- | --- |
| Yenile | Sayfayı yenilemek için kullanılan butondur. |
| Yeni | Yeni kayıt girmek için kullanılan butondur. |
| Düzenle | Mevcut kayıtlarda düzenleme amacıyla kullanılan butondur. |
| İzle | Mevcut kayıtlarda izleme yapabilmek için kullanılan butondur. |
| Kopyala | Listede seçili olan tahsilatı kopyalamak için kullanılan butondur. |
| Sil | İptali istenen kaydı silmek için kullanılan butondur. |
| Yazdır | Tanımlı dizayna göre çıktı alınmak istendiğinde kullanılan butondur. |


---
_Yol: EnRoute Panorama › Finans İşlemleri › Tahsilat İşlemleri_
