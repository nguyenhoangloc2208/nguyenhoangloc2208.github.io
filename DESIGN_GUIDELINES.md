# Hướng Dẫn Thiết Kế & Phát Triển Website

Tài liệu này tổng hợp các nguyên tắc, mẫu thiết kế, phong cách mã hóa và quy định về UI/UX của website, giúp đảm bảo tính nhất quán và dễ bảo trì khi phát triển các tính năng hoặc trang mới.

## 1. Tổng quan về Cấu trúc Dự án

Dự án được xây dựng trên nền tảng Gatsby.js, với cấu trúc thư mục chính như sau:

*   **`content/`**: Chứa tất cả nội dung tĩnh của trang web, được tổ chức theo loại:
    *   `featured/`: Các dự án nổi bật.
    *   `jobs/`: Thông tin về kinh nghiệm làm việc.
    *   `posts/`: Các bài viết blog, sử dụng định dạng Markdown.
    *   `projects/`: Các dự án cá nhân, sử dụng định dạng Markdown.
    Nội dung Markdown được xử lý bởi `gatsby-transformer-remark`.

*   **`src/`**: Chứa mã nguồn chính của ứng dụng React/Gatsby:
    *   `components/`: Các thành phần React tái sử dụng được.
        *   `sections/`: Nhóm các thành phần lớn, đại diện cho các phần riêng biệt của trang (ví dụ: About, Contact, Projects).
        *   `icons/`: Chứa các thành phần biểu tượng SVG.
    *   `config.js`: Tập trung các cấu hình toàn cục của trang web.
    *   `fonts/`: Các tệp phông chữ tùy chỉnh.
    *   `hooks/`: Các React Hooks tùy chỉnh để tái sử dụng logic.
    *   `images/`: Các hình ảnh tĩnh được sử dụng trong mã nguồn.
    *   `pages/`: Các trang chính của Gatsby (ví dụ: `index.js`, `404.js`).
    *   `styles/`: Định nghĩa các kiểu CSS toàn cục, chủ đề, biến và mixins.
    *   `templates/`: Các thành phần React được sử dụng làm khuôn mẫu cho các trang được tạo động (ví dụ: bài đăng blog, trang thẻ).
    *   `utils/`: Các hàm tiện ích chung.

*   **`static/`**: Chứa các tệp tĩnh như hình ảnh OG (Open Graph) và resume.

## 2. Mẫu Thiết kế & Phong cách Mã hóa

### 2.1. Cấu trúc Thành phần

*   **Thành phần Bố cục (Layout Component)**: `src/components/layout.js` đóng vai trò là thành phần bao bọc chính cho toàn bộ ứng dụng. Nó xử lý các mối quan tâm cấp độ ứng dụng như hiển thị `Loader`, điều hướng (`Nav`), các liên kết xã hội (`Social`), email (`Email`) và chân trang (`Footer`).
*   **Phân cấp Rõ ràng**: Các thành phần được tổ chức theo cấp bậc rõ ràng, với các thành phần chung ở cấp cao hơn (`layout.js`) và các thành phần cụ thể hơn được nhóm trong các thư mục như `sections/` và `icons/`.
*   **Thành phần Chức năng (Functional Components)**: Ưu tiên sử dụng các thành phần chức năng với React Hooks (`useState`, `useEffect`) thay vì các thành phần lớp.
*   **Xác thực Props (`PropTypes`)**: Sử dụng `PropTypes` để xác thực các props được truyền vào thành phần, đảm bảo tính nhất quán và giảm lỗi.

### 2.2. Quản lý Trạng thái

*   Sử dụng `useState` cho trạng thái cục bộ của thành phần.
*   Sử dụng `useEffect` để xử lý các hiệu ứng phụ, như gọi API, thao tác DOM hoặc thiết lập/dọn dẹp sự kiện.

### 2.3. Custom Hooks (`src/hooks/`)

Các custom hooks được sử dụng để đóng gói logic tái sử dụng liên quan đến tương tác người dùng và khả năng truy cập, giúp mã nguồn sạch và dễ bảo trì:

*   **`useOnClickOutside.js`**: Cung cấp cách hiệu quả để phát hiện các cú nhấp chuột bên ngoài một phần tử được tham chiếu (ví dụ: đóng menu, modal). Chú ý tối ưu hóa hiệu suất bằng cách sử dụng `useCallback` cho `handler`.
*   **`usePrefersReducedMotion.js`**: Phát hiện tùy chọn `prefers-reduced-motion` của người dùng để điều chỉnh hoặc tắt các hiệu ứng động, cải thiện khả năng truy cập. Xử lý tương thích với SSR.
*   **`useScrollDirection.js`**: Theo dõi hướng cuộn của trang (`up` hoặc `down`) để tạo các hiệu ứng UI động. Sử dụng `requestAnimationFrame` để tối ưu hóa hiệu suất cuộn.

### 2.4. Quy ước Đặt tên và Tổ chức Mã nguồn

*   **Alias Import**: Sử dụng alias cho đường dẫn import (ví dụ: `@components`, `@styles`) để làm cho các câu lệnh import ngắn gọn và dễ đọc hơn.
    ```javascript
    // src/components/layout.js
    import { Head, Loader, Nav, Social, Email, Footer } from '@components';
    import { GlobalStyle, theme } from '@styles';
    ```
*   **Tập trung Cấu hình**: Mọi cấu hình toàn cục của trang web (site metadata, liên kết mạng xã hội, liên kết điều hướng, màu sắc, cấu hình ScrollReveal) được định nghĩa tập trung trong `src/config.js`. Điều này giúp dễ dàng quản lý và cập nhật các giá trị này.
*   **Xử lý Liên kết Ngoài**: Tự động thêm thuộc tính `target="_blank" rel="noopener noreferrer"` cho tất cả các liên kết bên ngoài để cải thiện bảo mật và trải nghiệm người dùng.
*   **Sử dụng Biến CSS**: Ưu tiên sử dụng các biến CSS (`--var-name`) được định nghĩa tập trung thay vì các giá trị cứng để đảm bảo tính nhất quán và dễ dàng thay đổi kiểu dáng toàn cục.

### 2.5. Khả năng Tái sử dụng & DRY (Don't Repeat Yourself)

*   **Các Hàm Tiện ích (`src/utils/`)**: Mọi logic có thể tái sử dụng không thuộc về một thành phần cụ thể sẽ được đặt trong thư mục `src/utils/`.
*   **Custom Hooks (`src/hooks/`)**: Logic trạng thái có thể tái sử dụng được đóng gói thành các custom hooks.

## 3. UI/UX (Thiết kế Giao diện người dùng & Trải nghiệm người dùng)

### 3.1. Hệ thống Tạo kiểu (`styled-components` & Theming)

*   **`styled-components`**: Được sử dụng làm thư viện tạo kiểu chính.
*   **Hệ thống Chủ đề (Theming System)**:
    *   `ThemeProvider` được sử dụng trong `layout.js` để cung cấp chủ đề cho toàn bộ ứng dụng.
    *   `src/styles/theme.js` định nghĩa các thuộc tính của chủ đề (ví dụ: màu sắc, font-size, breakpoints) và tích hợp các mixins.
    *   **Biến CSS (`src/styles/variables.js`)**: Định nghĩa tất cả các biến CSS tùy chỉnh trong khối `:root`, bao gồm bảng màu chi tiết, font families, font sizes và các biến chung (border-radius, nav-height, transition, hamburger animations).
*   **Global Styles (`src/styles/GlobalStyle.js`)**: Định nghĩa các kiểu CSS cơ bản và các quy tắc đặt lại (reset) CSS được áp dụng trên toàn bộ trang web. Tích hợp sâu rộng các font, biến, và các kiểu cho hiệu ứng chuyển đổi (`TransitionStyles`) và làm nổi bật mã (`PrismStyles`). Bao gồm các kiểu focus cho khả năng truy cập và tùy chỉnh thanh cuộn.
*   **Mixins (`src/styles/mixins.js`)**: Chứa các đoạn mã CSS có thể tái sử dụng được định nghĩa bằng `styled-components/css` (ví dụ: `button`, `flexCenter`, `link`, `boxShadow`, `fancyList`). Điều này đảm bảo tính nhất quán về UI và giảm lặp lại mã CSS.

### 3.2. Trải nghiệm người dùng (UX)

*   **Hiệu ứng Tải (Loader)**: Một màn hình tải (`Loader`) được hiển thị khi trang đang tải lần đầu, cung cấp phản hồi trực quan cho người dùng.
*   **"Skip to Content" Link**: Một liên kết bỏ qua nội dung (`skip-to-content`) được cung cấp để cải thiện khả năng truy cập cho người dùng bàn phím hoặc công cụ đọc màn hình.
*   **Hiệu ứng Cuộn (Scroll Reveal)**: Sử dụng thư viện `ScrollReveal` (được tích hợp thông qua `src/utils/sr.js` và cấu hình `srConfig` trong `src/config.js`) để thêm các hiệu ứng động khi các phần tử xuất hiện khi cuộn trang, giúp trang web sống động và hấp dẫn hơn. Việc xử lý SSR trong `src/utils/sr.js` đảm bảo tương thích với môi trường Gatsby.
*   **Thiết kế Đáp ứng (Responsive Design)**: Được hỗ trợ mạnh mẽ thông qua việc định nghĩa các breakpoint trong `src/styles/theme.js` và sử dụng các đơn vị linh hoạt, đảm bảo giao diện hiển thị tốt trên nhiều kích thước màn hình.
*   **Hỗ trợ Giảm Chuyển động**: Sử dụng `usePrefersReducedMotion` hook để tôn trọng tùy chọn của người dùng về giảm hiệu ứng chuyển động, cải thiện khả năng truy cập.

Bằng cách tuân thủ các hướng dẫn này, bạn có thể duy trì một codebase sạch, dễ bảo trì và đảm bảo trải nghiệm UI/UX nhất quán trên toàn bộ trang web.