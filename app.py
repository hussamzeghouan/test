import streamlit as st
from PIL import Image, ImageOps
import numpy as np
import io
from datetime import datetime

# تكوين الصفحة
st.set_page_config(
    page_title="Halftone Logo Effect",
    page_icon="🎨",
    layout="wide",
    initial_sidebar_state="expanded"
)

# CSS مخصص
st.markdown("""
    <style>
    .stApp {
        direction: rtl;
    }
    .main-header {
        font-size: 3em;
        text-align: center;
        color: #2c3e50;
        padding: 20px;
        background: linear-gradient(120deg, #89f7fe 0%, #66a6ff 100%);
        border-radius: 10px;
        margin-bottom: 30px;
    }
    .info-box {
        background-color: #f0f2f6;
        padding: 15px;
        border-radius: 10px;
        margin-bottom: 20px;
    }
    .feature-card {
        background-color: #ffffff;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin-bottom: 15px;
    }
    </style>
""", unsafe_allow_html=True)

def main():
    st.markdown('<h1 class="main-header">🎨 تطبيق Halftone داخل شكل الشعار</h1>', unsafe_allow_html=True)
    
    # الشريط الجانبي للإعدادات
    st.sidebar.header("⚙️ الإعدادات")
    
    # خيارات التخصيص
    st.sidebar.subheader("🎯 الإعدادات الأساسية")
    
    gradient_type = st.sidebar.selectbox(
        "نوع التدرج", 
        ["دائري", "أفقي", "عمودي"], 
        help="اختر نوع التدرج للتكرارات"
    )
    
    tile_spacing = st.sidebar.slider(
        "عدد التكرارات (كلما قلّ الرقم زادت الكثافة)", 
        5, 50, 10, 1
    )
    
    min_size = st.sidebar.slider(
        "أصغر حجم للتكرار", 
        2, 20, 5, 1
    )
    
    max_size = st.sidebar.slider(
        "أكبر حجم للتكرار", 
        10, 100, 20, 1
    )
    
    # القسم الرئيسي
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.markdown("""
        <div class="info-box">
        <h3>📋 كيفية استخدام التطبيق:</h3>
        <ol>
        <li>ارفع صورة الشعار (PNG مفرغ أو JPEG)</li>
        <li>اختر نوع التدرج المناسب</li>
        <li>ضبط إعدادات التكرارات</li>
        <li>انقر على "معاينة النتيجة"</li>
        <li>حمّل الصورة النهائية</li>
        </ol>
        </div>
        """, unsafe_allow_html=True)
        
        uploaded_file = st.file_uploader(
            "ارفع صورة الشعار", 
            type=["png", "jpg", "jpeg"],
            help="يفضل استخدام PNG بخلفية شفافة"
        )
    
    with col2:
        st.markdown("""
        <div class="info-box">
        <h3>💡 نصائح للحصول على أفضل النتائج:</h3>
        <ul>
        <li>استخدم صوراً بدقة عالية للحصول على نتائج أفضل</li>
        <li>الشعارات البسيطة تعطي نتائج أوضح</li>
        <li>جرّب أنواع التدرج المختلفة لتأثيرات متنوعة</li>
        <li>قلل عدد التكرارات للحصول على تأثير أكثر كثافة</li>
        </ul>
        </div>
        """, unsafe_allow_html=True)
    
    if uploaded_file:
        try:
            # معالجة الصورة الأساسية
            image_rgba = Image.open(uploaded_file).convert("RGBA")
            
            # الحصول على معلومات الصورة الأصلية
            original_width, original_height = image_rgba.size
            aspect_ratio = original_width / original_height
            
            # تحديد الحجم المثالي للمعالجة
            max_size_processing = 600
            
            # حساب الأبعاد الجديدة
            if aspect_ratio > 1:
                output_width = max_size_processing
                output_height = int(max_size_processing / aspect_ratio)
            else:
                output_height = max_size_processing
                output_width = int(max_size_processing * aspect_ratio)
            
            # تغيير حجم الصورة
            image_rgba = image_rgba.resize((output_width, output_height), Image.Resampling.LANCZOS)
            r, g, b, a = image_rgba.split()
            
            # كشف الشعار
            if a.getextrema()[0] < 255:
                mask_resized = np.array(a) > 0
            else:
                image_gray = image_rgba.convert("L")
                mask_resized = np.array(image_gray) < 200
            
            # التحقق من وجود نقاط
            coords = np.column_stack(np.where(mask_resized))
            if coords.shape[0] == 0:
                st.error("لم يتم العثور على شعار مناسب في الصورة.")
                st.stop()
            
            # حساب المركز
            center_y, center_x = coords.mean(axis=0).astype(int)
            
            # تحضير وحدة التكرار
            tile_size_scaled = max(10, min(50, max(output_width, output_height) // 20))
            tile = image_rgba.resize((tile_size_scaled, tile_size_scaled), Image.Resampling.LANCZOS)
            
            # زر المعاينة
            if st.button("معاينة النتيجة", type="primary"):
                final_img = process_halftone_image(
                    image_rgba,
                    mask_resized,
                    gradient_type,
                    tile_spacing,
                    min_size,
                    max_size,
                    center_x,
                    center_y,
                    output_width,
                    output_height,
                    tile
                )
                
                # عرض النتيجة
                col1, col2 = st.columns([1, 1])
                
                with col1:
                    st.subheader("الصورة الأصلية")
                    st.image(image_rgba, caption="الشعار الأصلي", use_column_width=True)
                
                with col2:
                    st.subheader("النتيجة النهائية")
                    st.image(final_img, caption="تأثير Halftone", use_column_width=True)
                
                # زر التحميل
                buf = io.BytesIO()
                final_img.save(buf, format="PNG")
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                
                st.download_button(
                    label="📥 تحميل الصورة",
                    data=buf.getvalue(),
                    file_name=f"halftone_result_{timestamp}.png",
                    mime="image/png"
                )
                
                st.sidebar.markdown("---")
                st.sidebar.subheader("📋 معلومات الصورة")
                st.sidebar.write(f"الأبعاد النهائية: {output_width} × {output_height}")
                st.sidebar.write(f"عدد التكرارات: {(output_width // tile_spacing) * (output_height // tile_spacing)}")
            
        except Exception as e:
            st.error(f"حدث خطأ أثناء معالجة الصورة: {str(e)}")

def process_halftone_image(image_rgba, mask_resized, gradient_type, tile_spacing, 
                           min_size, max_size, center_x, center_y, 
                           output_width, output_height, tile):
    """معالجة الصورة لإنشاء تأثير halftone"""
    final_img = Image.new("RGBA", (output_width, output_height), (255, 255, 255, 0))
    
    for y in range(0, output_height, tile_spacing):
        for x in range(0, output_width, tile_spacing):
            if not (0 <= y < output_height and 0 <= x < output_width and mask_resized[y, x]):
                continue
            
            # حساب المسافة
            if gradient_type == "دائري":
                dist = np.hypot(x - center_x, y - center_y)
                max_dist = max(
                    np.hypot(center_x, center_y),
                    np.hypot(output_width - center_x, center_y),
                    np.hypot(center_x, output_height - center_y),
                    np.hypot(output_width - center_x, output_height - center_y)
                )
            elif gradient_type == "أفقي":
                dist = abs(x - center_x)
                max_dist = max(center_x, output_width - center_x)
            else:  # عمودي
                dist = abs(y - center_y)
                max_dist = max(center_y, output_height - center_y)
            
            # حساب الحجم
            scale = 1.0 - (dist / max_dist) if max_dist > 0 else 1.0
            tile_size_current = max(min_size, int(max_size * scale))
            
            # موضع اللصق
            paste_x = x - tile_size_current // 2
            paste_y = y - tile_size_current // 2
            
            # التحقق من الحدود
            if (paste_x < 0 or paste_y < 0 or 
                paste_x + tile_size_current > output_width or 
                paste_y + tile_size_current > output_height):
                continue
            
            # معالجة المنطقة الفرعية
            process_submask_region(
                final_img, mask_resized, tile, 
                paste_x, paste_y, tile_size_current, 
                output_width, output_height
            )
    
    return final_img

def process_submask_region(final_img, mask_resized, tile, 
                           paste_x, paste_y, tile_size_current, 
                           output_width, output_height):
    """معالجة المنطقة الفرعية وإضافة التكرار"""
    end_x = min(paste_x + tile_size_current, output_width)
    end_y = min(paste_y + tile_size_current, output_height)
    
    if paste_x >= 0 and paste_y >= 0:
        submask = mask_resized[paste_y:end_y, paste_x:end_x]
        
        if submask.size > 0 and np.all(submask):
            final_tile_size = min(tile_size_current, end_x - paste_x, end_y - paste_y)
            if final_tile_size > 0:
                tile_resized = tile.resize((final_tile_size, final_tile_size), Image.Resampling.LANCZOS)
                final_img.paste(tile_resized, (paste_x, paste_y), tile_resized)

if __name__ == "__main__":
    main()
