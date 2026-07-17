#!/bin/sh

# Bu script Xcode Cloud projeyi klonladıktan hemen sonra çalışır
# Bulunduğu konum: ios/ci_scripts/ci_post_clone.sh

# Proje kök dizinine geri dön
cd ../../

# Homebrew ile Node.js kurulumu
echo "Installing Node.js..."
brew install node

# Bağımlılıkları yükle
echo "Running npm install..."
npm install

# Expo Prebuild komutunu çalıştırarak iOS klasörünü oluştur
echo "Running npx expo prebuild..."
npx expo prebuild --platform ios --clean

echo "Post-clone script completed successfully!"
