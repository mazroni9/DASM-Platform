# سكربت لنسخ صور مزادات السيارات للحافلات والشاحنات

# التأكد من وجود المجلد
New-Item -ItemType Directory -Path "Frontend-local/public/auctionsPIC/car-busesTrucksPIC" -Force

# نسخ بعض الصور من المجلدات الأخرى وإعادة تسميتها
# نستخدم صور من المجلدات الموجودة بالفعل

# قائمة المجلدات المصدر المحتملة
$sourceFolders = @(
    "Frontend-local/public/auctionsPIC/car-luxuryPIC",
    "Frontend-local/public/auctionsPIC/car-classicPIC",
    "Frontend-local/public/auctionsPIC/car-caravanPIC",
    "Frontend-local/public/auctionsPIC/car-governmentPIC",
    "Frontend-local/public/auctionsPIC/car-greenPIC"
)

# قائمة أسماء الصور الجديدة
$targetNames = @(
    "mercedes-actros-2019.jpg",
    "mercedes-travego-2020.jpg",
    "volvo-fh16-2021.jpg",
    "hyundai-universe-2022.jpg",
    "man-tgx-2020.jpg"
)

$targetFolder = "Frontend-local/public/auctionsPIC/car-busesTrucksPIC"

# للتتبع عدد الصور التي تم نسخها
$copiedCount = 0

# البحث في كل مجلد مصدر
foreach ($sourceFolder in $sourceFolders) {
    if (Test-Path $sourceFolder) {
        $files = Get-ChildItem -Path $sourceFolder -Filter "*.jpg" -File
        
        # نسخ ملفات من هذا المجلد إذا وجدت
        foreach ($file in $files) {
            if ($copiedCount -lt $targetNames.Count) {
                $destination = Join-Path $targetFolder $targetNames[$copiedCount]
                Copy-Item -Path $file.FullName -Destination $destination -Force
                Write-Host "تم نسخ $($file.Name) إلى $destination"
                $copiedCount++
            }
            else {
                # تم نسخ العدد المطلوب من الصور
                break
            }
        }
    }
    
    # الخروج بمجرد نسخ كل الصور المطلوبة
    if ($copiedCount -ge $targetNames.Count) {
        break
    }
}

Write-Host "تم نسخ $copiedCount صورة إلى مجلد الحافلات والشاحنات." 