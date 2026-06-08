# İş Akış

_Kaynak: Panorama Kullanım Kılavuzu_

**Menü Adımı:** `iş Akış → Tanımlamalar → İş Akış`

## Ekran Tanımı

Belirlenen işlem koduna göre kullanıcı yada kullanıcı gruplarının belirli bir hiyerarşi sıralamasına göre onay mekanizmasını devreye sokmasıdır. Örneğin distribütör kullanıcısı herhangi bir işlem kodundan programda kayıt girdiği anda, bir üst yöneticisinin onayına düşmesi sağlanır. İstendiği takdirde bu hiyerarşi kademelerinin sayısı arttırılarak onaylayan yöneticinin de bir üst yöneticisinin de onayına düşmesi sağlanabilir.

## Alan Açıklamaları

| Alan | Açıklama |
| --- | --- |
| İşlem Kodu | İşlem kodunun seçildiği alandır ve zorunludur. |
| Durum | İş Akış tanımının durum bilgisinin gösterildiği alandır. Aktif ve Pasif değerlerini alır. |
| Ödeme Tipi | Belgenin ödeme tipinin belirlenebildiği alandır. |
| Hareket Tip | Hareket tipine bağlı olarak kriter girilebilecek bir rehber alanıdır. |
| Giriş Tip | Belgenin ilk kayıt edildiği yer bilgisi alanıdır. |
| Müşteri Grup Kod | İşlem koduna bağlı olarak aktif ya da pasif gelen müşteri grup kod kriter bilgisidir. Rehber alandır. |
| Müşteri Ek Grup Kod | İşlem koduna bağlı olarak aktif ya da pasif gelen müşteri ek grup kod kriter bilgisidir. Rehber alandır. |
| Ad | İş Akış tanımının ad bilgisidr ve zorunlu bir alandır. |
| Veri Grişi | Sadece işlem kodu Veri Girişi seçildiğinde aktif olan kriter sahasıdır. |
| Uygulama Yeri | Sadece Yeni Ürün işlem kodu seçildiğinde aktif olan sahadır. |
| Seviyeli Ürün-1 | Sadece İsk/Pro işlem kodu seçildiğinde aktif olan kriter sahasıdır. |
| Üretici Kodu | Bazı işlem kodlarına bağlı olarak aktif olan üretici kodlarının seçilebildiği rehber alandır. |
| Servis Tipi | Servis Talep işlem kodlarına bağlı olarak aktif olan servis tip alanıdır. |
| Servis Durumu | Servis Talep işlem kodlarına bağlı olarak aktif olan servis durum alanıdır. |
| Aktivite Grup Kod | Sadece Bütçe ve Aktivite Talep işlem kodu seçildiğinde aktif olan kriter sahasıdır. |
| Ürün Dinamik Grup | Sadece Alınan sipariş işlem kodu seçildiğinde aktif olan sahadır. |
| Onaylanmamış Belgeler Stok Hareketi Yaratmasın | Stoğu ilgilendiren iş akışlarla ilgili stok hareketinin sağlanıp sağlanmayacağını belirten iş akış parametresidir. |
| Tüm aktivite faturaları onaya düşsün | Aktivite faturalarının onaya düşüp düşmeme parametresidir. |
| İleten Grup | İlk kademe tanımlandığında boş gelir. Birden fazla kademeli tanımlarda ise bir önceki kademeyi default getirir müdahele edilemez alandır. |
| Onaylayan Grup | Onaylayacak olan kullanıcı grup sahasıdır. Zorunlu alandır. |
| Tutar | Belgenin belirlenen tutar üzerinde onaya düşmesini sağlayan sahadır. |
| Ağırlık | Belgenin belirlenen ağırlık üzerinde onaya düşmesini sağlayan sahadır. |
| İskonto 8 Oranı % | Bazı işlem kodlarına göre iskonto 8 sahasının girilen değere göre onaya düşmesini sağlayan sahadır. |
| Belge Başlık Düzeltme | Onaylayacak kullanıcı grubunun belge başlık düzeltme iznini sağlayan parametredir. |
| Ödeme Bilgi Düzeltme | Onaylayacak kullanıcı grubunun ödeme bilgi düzeltme iznini sağlayan parametredir. |
| Kayıt Düzenle | Onaylayacak kullanıcı grubunun kayıt düzenle iznini sağlayan parametredir. |
| Bilgi Maili | Onaylayacak kullanıcı grubuna mail yolu ile bilgi verilmesi isteniyor ise işaretlenmesi gereken parametredir. |
| Panorama Social Mesajı | İş akış onayında Panorama Social kutusu işaretli ise ve kullanıcının Social da karşılığı varsa PDF formatında iş akışının konusunun bulunduğu dosya, bildirim olarak kullanıcının Social hesabında görüntülenecektir. Aynı şekilde Bildirimler Panorama tarafında da bildirim bölümünden takip edilebilmektedir. Social tarafında gelen bildirimler sadece o kullanıcı tarafından gözükmektedir |
| Merkez Rota İşlemleri | Rut İşlemleri ile ilgili iş akış süreçlerine bağlı olarak merkez rota işlemlerinin belirlendiği parametredir. |


---
_Yol: EnRoute Panorama › İş Akış › Tanımlamalar_
