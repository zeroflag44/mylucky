# MYLUCKY Token Projesi - Detaylı Türkçe Açıklama

## 📚 İçindekiler

1. [Proje Genel Bakış](#proje-genel-bakış)
2. [Akıllı Kontratlar Açıklaması](#akıllı-kontratlar-açıklaması)
3. [Script Dosyaları](#script-dosyaları)
4. [Yapılandırma Dosyaları](#yapılandırma-dosyaları)
5. [Deployment Süreci](#deployment-süreci)
6. [Güvenlik Özellikleri](#güvenlik-özellikleri)

---

## Proje Genel Bakış

### MYLUCKY Token Nedir?

MYLUCKY, blockchain üzerinde çalışan, güvenli ve şeffaf bir kripto para token'ıdır. Bu proje:

- **ERC-20 Standardı:** Ethereum ve benzeri blokzincirlerle uyumlu
- **Sabit Arz:** 1 milyar token - daha fazla basılamaz
- **Güvenlik Odaklı:** Hiçbir yönetici kontrolü yok
- **Şeffaf:** Tüm işlemler blokzincirde görülebilir

### Projenin Amacı

Bu token, DEX (Merkezi Olmayan Borsa) üzerinde adil bir şekilde piyasaya sürülmek için tasarlanmıştır. Özellikler:

1. **Adil Dağıtım:** Tokenlar önceden belirlenmiş kurallara göre dağıtılır
2. **Güvenli Vesting:** Kurucu payı kademeli olarak serbest bırakılır
3. **Likidite Kilidi:** DEX'teki likidite 12 ay kilitlenir
4. **Yönetici Yok:** Deploy edildikten sonra kimse kontratı değiştiremez

---

## Akıllı Kontratlar Açıklaması

### 1. MyLucky.sol - Ana Token Kontratı

#### Ne İşe Yarar?
Bu dosya MYLUCKY token'ının kendisidir. Tüm token'lar bu kontratta yaratılır ve dağıtılır.

#### Önemli Özellikler:

**Sabit Değerler (Constants):**
```solidity
uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18;
```
- **Açıklama:** Toplam 1 milyar token (18 decimal ile)
- **Neden Sabit?** Kimse daha fazla token basıp piyasaya süremez

**Dağılım:**
```solidity
TREASURY_ALLOCATION = 700_000_000 * 10**18;  // %70
FOUNDER_ALLOCATION = 150_000_000 * 10**18;   // %15
COMMUNITY_ALLOCATION = 150_000_000 * 10**18; // %15
```

**Treasury (Hazine) - %70:**
- Gnosis Safe multisig cüzdanına gider
- 5 kişiden 3'ü imzalamalı (3/5)
- Kullanım alanları:
  - Pazarlama
  - Borsa listeleme ücretleri
  - Geliştirme masrafları
  - Topluluk etkinlikleri

**Founder (Kurucu) - %15:**
- Vesting kontratına gönderilir
- İlk 6 ay hiç kullanamaz (cliff)
- 24 ay boyunca kademeli serbest bırakılır
- Böylece kurucu hemen satıp kaçamaz

**Community (Topluluk) - %15:**
- Likidite sağlama için
- Ödül programları için
- Topluluk etkinlikleri için

#### Güvenlik Önlemleri:

**1. Address Validation (Adres Doğrulama):**
```solidity
require(_treasury != address(0), "MyLucky: treasury is zero address");
```
- **Açıklama:** Hiçbir adresin "0x0000...0000" olmamasını garantiler
- **Neden Önemli?** Yanlışlıkla token'lar yokluğa gönderilemez

**2. Immutable (Değiştirilemez) Değişkenler:**
```solidity
address public immutable treasury;
```
- **Açıklama:** Bu adres deploy edildikten sonra değiştirilemez
- **Neden Önemli?** Kimse sahtecilik yapamaz, adresler değiştirilemez

**3. Assert Kontrolü:**
```solidity
assert(totalSupply() == TOTAL_SUPPLY);
```
- **Açıklama:** Dağıtımdan sonra toplam arzı kontrol eder
- **Neden Önemli?** Matematiksel hata olmadığını garanti eder

**Ne Yoktur?**
- ❌ `mint()` fonksiyonu - Yeni token basılamaz
- ❌ `burn()` fonksiyonu - Token yakılamaz
- ❌ `owner` değişkeni - Yönetici yok
- ❌ `transferOwnership()` - Sahiplik devri yok
- ❌ Transfer vergileri - Her işlemde kesinti yok
- ❌ Pause mekanizması - Token durdurulamaz

---

### 2. TeamVesting.sol - Kurucu Token Kilitleme Kontratı

#### Ne İşe Yarar?
Bu kontrat, kurucunun token'larını belirli bir süreye yayarak serbest bırakır. Böylece kurucu token'ları alıp hemen satamaz.

#### Vesting Planı:

**Cliff Period (Bekleme Süresi) - 6 Ay:**
```solidity
uint64 public constant CLIFF_DURATION = 180 days;
```
- İlk 6 ay hiçbir token serbest bırakılmaz
- Kurucu bu sürede token kullanamaz
- Bu süre, projenin gelişmesi için zaman tanır

**Vesting Duration (Kademeli Serbest Bırakma) - 24 Ay:**
```solidity
uint64 public constant VESTING_DURATION = 730 days;
```
- Cliff bitince, 24 ay boyunca her gün eşit miktarda token serbest bırakılır
- Örnek: 150M token / 730 gün = günlük yaklaşık 205,479 token

**Toplam Süre:**
- 6 ay bekleme + 24 ay vesting = 30 ay

#### Nasıl Çalışır?

**1. Deploy Anında:**
```solidity
deploymentTime = uint64(block.timestamp);
cliffEnd = uint64(block.timestamp) + CLIFF_DURATION;
vestingEnd = uint64(block.timestamp) + TOTAL_DURATION;
```
- Başlangıç zamanı kaydedilir
- Cliff bitiş tarihi hesaplanır
- Vesting bitiş tarihi hesaplanır

**2. Token Serbest Bırakma:**
```solidity
function releasable(address token) public view override returns (uint256) {
    if (block.timestamp < cliffEnd) {
        return 0;  // Cliff süresindeyse 0 döner
    }
    return super.releasable(token);  // Cliff bittiyse hesapla
}
```

**Örnek Senaryo:**
- Deploy Tarihi: 1 Ocak 2025
- Cliff Bitişi: 1 Temmuz 2025 (6 ay sonra)
- İlk Token Serbest: 1 Temmuz 2025
- Vesting Bitişi: 1 Temmuz 2027 (30 ay sonra)

**Kurucu Ne Zaman Ne Kadar Alır?**
- 1 Ocak - 1 Temmuz 2025: 0 token
- 1 Temmuz 2025: ~6.25M token (1 ay = 150M / 24)
- 1 Ağustos 2025: Toplam ~12.5M token
- 1 Temmuz 2027: Tüm 150M token

---

### 3. LPTokenLock.sol - Likidite Kilitleme Kontratı

#### Ne İşe Yarar?
DEX'e likidite eklendikten sonra alınan LP token'ları bu kontratta kilitlenir. Böylece likiditenin ani çekilmesi önlenir.

#### Neden Önemli?

**Likidite Nedir?**
- DEX'te işlem yapılabilmesi için bir havuza token konulması gerekir
- Örnek: MYLUCKY/USDT havuzu = Bir yanda MYLUCKY, diğer yanda USDT

**LP Token Nedir?**
- Likidite sağladığınızda DEX size bir "makbuz" verir
- Bu makbuza LP (Liquidity Provider) token denir
- LP token'ı olan, likiditeyi geri çekebilir

**Kilit Nasıl Çalışır?**

```solidity
constructor(address _lpToken, address _beneficiary, uint256 _lockDuration) {
    lpToken = _lpToken;           // Hangi LP token kilitlenecek
    beneficiary = _beneficiary;    // Kilit açılınca kime gidecek
    unlockTime = block.timestamp + _lockDuration;  // Ne zaman açılacak
}
```

**Kilitleme Süreci:**
1. LP token'ları bu kontrata gönderilir
2. 12 ay boyunca kimse çekemez
3. 12 ay sonra sadece beneficiary çekebilir

**Güvenlik:**
```solidity
function release() external {
    require(block.timestamp >= unlockTime, "Tokens are still locked");
    // Süre dolmadan açılamaz
}
```

---

## Script Dosyaları

### 1. deploy.js - Deployment Script'i

#### Ne İşe Yarar?
Bu script, akıllı kontratları blockchain'e yükler (deploy eder).

#### Adım Adım Çalışma:

**Adım 1: Çevre Değişkenlerini Kontrol Et**
```javascript
const treasuryAddress = process.env.TREASURY_ADDRESS;
const founderAddress = process.env.FOUNDER_ADDRESS;
const communityAddress = process.env.COMMUNITY_ADDRESS;
```
- .env dosyasından adresleri okur
- Eksik adres varsa hata verir

**Adım 2: Adresleri Doğrula**
```javascript
if (!ethers.isAddress(treasuryAddress)) {
    throw new Error("❌ Invalid TREASURY_ADDRESS");
}
```
- Her adresin geçerli bir Ethereum adresi olduğunu kontrol eder

**Adım 3: TeamVesting'i Deploy Et**
```javascript
const TeamVesting = await ethers.getContractFactory("TeamVesting");
const teamVesting = await TeamVesting.deploy(founderAddress);
```
- Önce vesting kontratı deploy edilir
- Çünkü token kontratı vesting adresine ihtiyaç duyar

**Adım 4: MyLucky Token'ı Deploy Et**
```javascript
const MyLucky = await ethers.getContractFactory("MyLucky");
const myLucky = await MyLucky.deploy(
    treasuryAddress,
    vestingAddress,
    communityAddress
);
```
- Token kontratı deploy edilir
- Aynı anda tüm dağıtım yapılır

**Adım 5: Doğrulama ve Kayıt**
```javascript
const deploymentInfo = {
    network: hre.network.name,
    contracts: {
        token: tokenAddress,
        vesting: vestingAddress,
        // ...
    }
};
fs.writeFileSync("deployments.json", JSON.stringify(deploymentInfo, null, 2));
```
- Tüm bilgiler bir JSON dosyasına kaydedilir
- Daha sonra bu adresler kullanılabilir

**Çıktı Örneği:**
```
🚀 Starting MYLUCKY Token Deployment...
📝 Deploying contracts with account: 0x1234...
💰 Account balance: 1.5 ETH

📦 Deploying TeamVesting contract...
✅ TeamVesting deployed to: 0xABCD...

📦 Deploying MyLucky token...
✅ MyLucky token deployed to: 0xEF01...

💰 Token Distribution:
   Treasury: 700000000.0 MYLUCKY (70%)
   Vesting: 150000000.0 MYLUCKY (15%)
   Community: 150000000.0 MYLUCKY (15%)
```

---

### 2. launch-liquidity.js - DEX Likidite Script'i

#### Ne İşe Yarar?
Bu script, token'ı bir DEX'te işlem görmesi için havuz oluşturur ve likidite ekler.

#### Adım Adım Çalışma:

**Adım 1: Uniswap ile Bağlantı Kur**
```javascript
const factory = new ethers.Contract(factoryAddress, UNISWAP_FACTORY_ABI, signer);
```
- Uniswap Factory kontratına bağlanır
- Factory, yeni havuzlar oluşturur

**Adım 2: Havuz Oluştur veya Bul**
```javascript
let poolAddress = await factory.getPool(tokenAddress, pairedTokenAddress, FEE_TIER);
if (poolAddress === ethers.ZeroAddress) {
    // Havuz yoksa oluştur
    await factory.createPool(tokenAddress, pairedTokenAddress, FEE_TIER);
}
```
- MYLUCKY/USDT veya MYLUCKY/WETH havuzu kontrol edilir
- Yoksa yeni oluşturulur
- 0.3% ücret seviyesi kullanılır

**Adım 3: Token'ları Onayla**
```javascript
await token.approve(routerAddress, tokenAmount);
await pairedToken.approve(routerAddress, pairedAmount);
```
- Uniswap'ın token'ları kullanmasına izin verir
- Güvenlik için gerekli onay

**Adım 4: LP Lock Kontratı Deploy Et**
```javascript
const lpLock = await deployTimeLock(
    poolAddress, 
    treasuryAddress, 
    365 * 24 * 60 * 60  // 12 ay
);
```
- LP token'ları kilitleyecek kontratı deploy eder
- 12 aylık kilit süresi

**Manuel Adım:**
Script, likidite eklemeyi otomatik yapamaz çünkü Uniswap V3 karmaşıktır. Bu yüzden:
1. Script pool'u oluşturur
2. Token'ları onaylar
3. Kullanıcı manuel olarak Uniswap arayüzünden likidite ekler
4. Alınan LP token'ları lock kontratına gönderilir

---

## Yapılandırma Dosyaları

### 1. hardhat.config.js - Hardhat Yapılandırması

#### Ne İşe Yarar?
Hardhat geliştirme ortamının tüm ayarlarını içerir.

#### Solidity Ayarları:
```javascript
solidity: {
    version: "0.8.24",  // Sabit versiyon (güvenlik için)
    settings: {
        optimizer: {
            enabled: true,  // Kod optimizasyonu açık
            runs: 200       // Orta düzey optimizasyon
        }
    }
}
```
- **Optimizer:** Gas ücretlerini azaltır
- **Runs: 200:** Deploy ucuz, çalıştırma orta maliyetli

#### Network (Ağ) Ayarları:
```javascript
networks: {
    base: {
        url: process.env.BASE_RPC_URL,
        accounts: [process.env.DEPLOYER_PRIVATE_KEY],
        chainId: 8453
    }
}
```
- Her ağ için RPC URL gerekir
- Private key ile işlem yapılır
- Chain ID ağı tanımlar

**Desteklenen Ağlar:**
- **Base:** Coinbase'in Layer 2 ağı (ucuz, hızlı)
- **Arbitrum:** Ethereum Layer 2 (ucuz gas)
- **Polygon:** Yan zincir (çok ucuz)
- **Sepolia:** Test ağı (gerçek para yok)

---

### 2. .env.example - Çevre Değişkenleri Şablonu

#### Ne İşe Yarar?
Deploy için gerekli tüm bilgilerin örneğini gösterir.

#### Önemli Değişkenler:

**DEPLOYER_PRIVATE_KEY:**
- Deploy edecek cüzdanın private key'i
- ⚠️ DİKKAT: Asla paylaşmayın, git'e eklemeyin!

**TREASURY_ADDRESS:**
- Gnosis Safe multisig adresi
- %70'lik hazine payı buraya gider
- 3/5 imza gerektiren güvenli cüzdan

**FOUNDER_ADDRESS:**
- Kurucunun cüzdan adresi
- Vesting kontratının beneficiary'si
- 30 ay sonra token'lar buraya gelir

**COMMUNITY_ADDRESS:**
- Topluluk rezerv cüzdanı
- Likidite ve ödüller için kullanılır

**Ağ Adresleri (Örnek Base için):**
- WETH: 0x4200000000000000000000000000000000000006
- Uniswap Router: 0x2626664c2603336E57B271c5C0b26F421741e481
- Uniswap Factory: 0x33128a8fC17869897dcE68Ed026d694621f6FDfD

---

### 3. package.json - NPM Yapılandırması

#### Ne İşe Yarar?
Projenin bağımlılıklarını ve komutlarını tanımlar.

#### Önemli Script'ler:
```json
"scripts": {
    "compile": "hardhat compile",              // Kontratları derle
    "test": "hardhat test",                    // Testleri çalıştır
    "deploy:base": "hardhat run scripts/deploy.js --network base"
}
```

#### Bağımlılıklar:
- **hardhat:** Geliştirme ortamı
- **@openzeppelin/contracts:** Güvenli kontrat kütüphanesi
- **ethers.js:** Ethereum ile etkileşim
- **dotenv:** Çevre değişkenleri yönetimi

---

## Deployment Süreci

### Adım 1: Hazırlık

```bash
# Repoyu klonla
git clone https://github.com/zeroflag44/mylucky.git
cd mylucky

# Bağımlılıkları yükle
npm install

# .env dosyası oluştur
cp .env.example .env
```

### Adım 2: Cüzdan Hazırlığı

**Gnosis Safe Oluştur:**
1. https://app.safe.global/ adresine git
2. "Create Safe" tıkla
3. 5 signer ekle
4. "3 out of 5" ayarla
5. Safe adresini kopyala

**Private Key Al:**
1. MetaMask'tan private key'i export et
2. .env dosyasına DEPLOYER_PRIVATE_KEY olarak ekle
3. Cüzdanda deploy için yeterli ETH (veya Base için) olmalı

### Adım 3: Test Deployment

```bash
# Sepolia test ağında dene
npm run deploy:sepolia
```

**Kontroller:**
- Vesting kontra tı doğru deploy oldu mu?
- Token kontratı doğru deploy oldu mu?
- Dağılımlar doğru mu? (%70, %15, %15)

### Adım 4: Mainnet Deployment

```bash
# Base ağında deploy et
npm run deploy:base
```

**Deploy Sonrası:**
1. Tüm adresleri kaydet
2. Block explorer'da doğrula
3. deployments.json dosyasını sakla

### Adım 5: Kontrat Doğrulama

```bash
# Kaynak kodunu doğrula
npx hardhat verify --network base <TOKEN_ADDRESS> <TREASURY> <VESTING> <COMMUNITY>
```

**Neden Önemli?**
- Herkes kaynak kodunu görebilir
- Block explorer'da kontrat okunabilir
- Güven sağlar

### Adım 6: Likidite Lansmanı

```bash
# Likidite script'ini çalıştır
npm run launch:liquidity
```

**Manuel Adımlar:**
1. Uniswap arayüzüne git
2. MYLUCKY/USDT havuzunu bul
3. Community cüzdanından likidite ekle
4. LP token'ları al
5. LP token'ları lock kontratına gönder

---

## Güvenlik Özellikleri

### 1. Kod Güvenliği

**Sabit Compiler Versiyonu:**
```solidity
pragma solidity 0.8.24;
```
- Caret (^) kullanılmaz
- Versiyon değişmez
- Güvenlik yamalarında kontrollü güncelleme

**OpenZeppelin Kütüphaneleri:**
```solidity
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
```
- Milyonlarca dolar güvence altında test edilmiş
- Düzenli audit'ler
- Endüstri standardı

### 2. Matematiksel Güvenlik

**Overflow/Underflow Koruması:**
```solidity
// Solidity 0.8+ otomatik kontrol yapar
uint256 result = a + b;  // Taşma olursa revert eder
```

**Assert Kontrolleri:**
```solidity
assert(totalSupply() == TOTAL_SUPPLY);
```
- Deploy sonrası matematiksel doğruluk
- Hata varsa işlem geri alınır

### 3. Adres Güvenliği

**Sıfır Adres Kontrolü:**
```solidity
require(_treasury != address(0), "treasury is zero address");
```
- Yanlışlıkla token kaybı önlenir

**Immutable Adresler:**
```solidity
address public immutable treasury;
```
- Deploy sonrası değiştirilemez
- Sahtecilik riski yok

### 4. Fonksiyon Güvenliği

**No Owner Pattern:**
- Ownable kullanılmaz
- onlyOwner modifier'ı yok
- Merkezi kontrol yok

**No Upgrade:**
- Proxy pattern kullanılmaz
- upgradeToAndCall() yok
- Kontrat değiştirilemez

**No Pause:**
- pause()/unpause() fonksiyonları yok
- Token durdurulamaz
- Sürekli erişilebilir

### 5. Transfer Güvenliği

**No Tax:**
```solidity
function transfer(address to, uint256 amount) public override returns (bool) {
    return super.transfer(to, amount);
}
```
- Her transferde kesinti yok
- Hidden fee yok
- Şeffaf işlemler

### 6. Time-Lock Güvenliği

**Vesting Cliff:**
```solidity
if (block.timestamp < cliffEnd) {
    return 0;
}
```
- Erken çekim imkansız
- Zaman kilidi güvenli

**LP Lock:**
```solidity
require(block.timestamp >= unlockTime, "Tokens are still locked");
```
- Erken çözme mekanizması yok
- Garantili kilit süresi

---

## Sık Sorulan Sorular

### Token Hakkında

**S: Token'ın toplam arzı değişebilir mi?**
C: Hayır. 1 milyar token sabit. Ne artırılabilir ne azaltılabilir.

**S: Yeni token basılabilir mi?**
C: Hayır. mint() fonksiyonu yok. Sadece deploy anında yaratılır.

**S: Token yakılabilir mi?**
C: Hayır. burn() fonksiyonu yok. Arz sabittir.

**S: Transfer vergisi var mı?**
C: Hayır. Transfer tax yok. Gönderdiğiniz miktar eksiksiz ulaşır.

### Kontrat Hakkında

**S: Kontrat sonradan değiştirilebilir mi?**
C: Hayır. Upgrade mekanizması yok. Deploy edilen koddur.

**S: Admin kontratlı durdurabilir mi?**
C: Hayır. Pause mekanizması yok. Owner yok.

**S: Adresler değiştirilebilir mi?**
C: Hayır. Treasury, vesting, community adresleri immutable (değiştirilemez).

### Vesting Hakkında

**S: Kurucu token'ları hemen kullanabilir mi?**
C: Hayır. 6 ay cliff var. İlk 6 ay hiçbir token kullanamaz.

**S: 6 ay sonra tüm token'lar serbest mi?**
C: Hayır. 6 aydan sonra 24 ay boyunca kademeli serbest bırakılır.

**S: Vesting planı değiştirilebilir mi?**
C: Hayır. Deploy sonrası hiçbir değişiklik yapılamaz.

### Likidite Hakkında

**S: LP token'ları erken çekilebilir mi?**
C: Hayır. 12 ay kilit süresi var. Bu süre sonunda açılır.

**S: Likidite ani çekilebilir mi?**
C: Hayır. LP token'ları kilitli olduğu için likidite güvende.

**S: Kilit süresi kısaltılabilir mi?**
C: Hayır. Unlock time immutable. Değiştirilemez.

---

## Sonuç

Bu proje, güvenlik ve şeffaflık odaklı, topluluk dostu bir token ekosistemidir. Her detay, adil bir lansman ve uzun vadeli sürdürülebilirlik için düşünülmüştür.

**Temel Prensipler:**
1. ✅ Güvenlik > Hype
2. ✅ Şeffaflık > Esneklik
3. ✅ Sıfır Gizli Kontrol

**Kimse Yapamaz:**
- ❌ Yeni token basamaz
- ❌ Token yakamaz
- ❌ Kontratlı durduramaz
- ❌ Adresleri değiştiremez
- ❌ Vesting'i değiştiremez
- ❌ Vergi ekleyemez

Tüm güç, başlangıçta belirlenen kurallardadır ve bu kurallar değiştirilemez.

---

**Proje Başarıyla Tamamlandı! 🎉**

Sorularınız için: [GitHub Issues](https://github.com/zeroflag44/mylucky/issues)
