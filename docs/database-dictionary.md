# Database Dictionary

Tài liệu mô tả các bảng và cột theo schema hiện có (tổng hợp từ entities/DBML).

Quy ước:
- **Ràng buộc** chỉ liệt kê: `PK`, `FK`, `unique`, `not null`, `default: ...`, `increment`, `delete: cascade`.
- Không ghi `nullable` (đúng theo yêu cầu).

## users

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| id | uuid | PK | Định danh người dùng (UUID). |
| email | varchar | not null, unique | Email đăng nhập. |
| password | varchar | not null | Mật khẩu (được hash trước khi lưu). |
| name | varchar | not null | Họ tên người dùng. |
| gender | varchar | default: 'male' | Giới tính (chuỗi). |
| birthday | timestamp | not null | Ngày sinh. |
| phone | varchar | not null | Số điện thoại. |
| address | varchar | not null | Địa chỉ. |
| avatar | varchar | default: '/public/defaults/default-avatar.png' | Đường dẫn ảnh đại diện. |
| avatarPublicId | varchar |  | Public ID ảnh trên Cloudinary (nếu có). |
| role | role | default: 'staff' | Vai trò hệ thống (`admin`/`staff`). |
| isActive | boolean | default: true | Trạng thái kích hoạt tài khoản. |
| refreshToken | varchar |  | Refresh token hiện tại (nếu lưu). |
| createdAt | timestamp |  | Thời điểm tạo bản ghi. |
| updatedAt | timestamp |  | Thời điểm cập nhật bản ghi. |
| deletedAt | timestamp |  | Thời điểm xóa mềm. |

## categories

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| id | uuid | PK | Định danh danh mục (UUID). |
| name | varchar | not null | Tên danh mục món. |
| createdAt | timestamp |  | Thời điểm tạo bản ghi. |
| updatedAt | timestamp |  | Thời điểm cập nhật bản ghi. |
| deletedAt | timestamp |  | Thời điểm xóa mềm. |

## item

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| id | uuid | PK | Định danh món/hàng hóa (UUID). |
| name | varchar | not null | Tên món. |
| price | int | not null | Giá bán (đơn vị theo quy ước hệ thống). |
| description | varchar |  | Mô tả món. |
| image | varchar |  | URL/đường dẫn ảnh món. |
| imagePublicId | varchar |  | Public ID ảnh trên Cloudinary (nếu có). |
| status | item_status | default: 'available' | Trạng thái món (`available`/`out of stock`/`discontinued`). |
| categoryId | uuid | FK -> categories.id | Danh mục của món. |
| createdAt | timestamp |  | Thời điểm tạo bản ghi. |
| updatedAt | timestamp |  | Thời điểm cập nhật bản ghi. |
| deletedAt | timestamp |  | Thời điểm xóa mềm. |

## ingredient

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| id | uuid | PK | Định danh nguyên liệu (UUID). |
| name | varchar | not null | Tên nguyên liệu. |
| amountLeft | int | not null | Số lượng tồn hiện tại. |
| measureUnit | measure_unit |  | Đơn vị đo tồn kho (g/kg/l/ml/pcs/tsp/tbsp). |
| minAmount | int | default: 0 | Ngưỡng tồn tối thiểu để cảnh báo. |
| pricePerUnitPrice | decimal(12,2) | default: 0 | Giá theo đơn vị (phần giá). |
| pricePerUnitUnit | measure_unit |  | Đơn vị áp dụng cho giá theo đơn vị. |
| image | varchar |  | URL/đường dẫn ảnh nguyên liệu. |
| imagePublicId | varchar |  | Public ID ảnh trên Cloudinary (nếu có). |
| createdAt | timestamp |  | Thời điểm tạo bản ghi. |
| updatedAt | timestamp |  | Thời điểm cập nhật bản ghi. |
| deletedAt | timestamp |  | Thời điểm xóa mềm. |

## recipe

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| id | uuid | PK | Định danh công thức (UUID). |
| itemId | uuid | FK -> item.id | Món áp dụng công thức này. |
| createdAt | timestamp |  | Thời điểm tạo bản ghi. |
| updatedAt | timestamp |  | Thời điểm cập nhật bản ghi. |
| deletedAt | timestamp |  | Thời điểm xóa mềm. |

## recipe_ingredients

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| id | uuid | PK | Định danh dòng nguyên liệu trong công thức (UUID). |
| ingredientId | uuid | FK -> ingredient.id | Nguyên liệu được dùng trong công thức. |
| recipeId | uuid | FK -> recipe.id | Công thức chứa nguyên liệu này. |
| amount | int | not null | Lượng nguyên liệu sử dụng cho công thức. |
| createdAt | timestamp |  | Thời điểm tạo bản ghi. |
| updatedAt | timestamp |  | Thời điểm cập nhật bản ghi. |
| deletedAt | timestamp |  | Thời điểm xóa mềm. |

## tables

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| id | uuid | PK | Định danh bàn (UUID). |
| name | varchar | not null | Tên/nhãn bàn. |
| seat | int | not null | Số chỗ ngồi. |
| status | table_status | default: 'available' | Trạng thái bàn (`available`/`occupied`/`reserved`). |
| createdAt | timestamp |  | Thời điểm tạo bản ghi. |
| updatedAt | timestamp |  | Thời điểm cập nhật bản ghi. |
| deletedAt | timestamp |  | Thời điểm xóa mềm. |

## orders

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| id | uuid | PK | Định danh đơn hàng (UUID). |
| totalAmount | int | not null | Tổng tiền đơn hàng. |
| ingredientCost | decimal(12,2) | default: 0 | Tổng chi phí nguyên liệu ước tính cho đơn. |
| status | order_status | default: 'pending' | Trạng thái đơn (`pending`/`paid`/`cancelled`). |
| orderCode | varchar | unique | Mã đơn hàng hiển thị/đối soát. |
| createdBy | uuid | FK -> users.id | Người tạo đơn. |
| tableId | uuid | FK -> tables.id | Bàn liên quan đến đơn. |
| createdAt | timestamp |  | Thời điểm tạo đơn. |
| updatedAt | timestamp |  | Thời điểm cập nhật đơn. |
| deletedAt | timestamp |  | Thời điểm xóa mềm. |

## order_item

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| id | uuid | PK | Định danh dòng món trong đơn (UUID). |
| amount | int | not null | Số lượng món. |
| orderId | uuid | FK -> orders.id | Đơn hàng chứa dòng này. |
| itemId | uuid | FK -> item.id | Món được đặt. |
| createdAt | timestamp |  | Thời điểm tạo bản ghi. |
| updatedAt | timestamp |  | Thời điểm cập nhật bản ghi. |
| deletedAt | timestamp |  | Thời điểm xóa mềm. |

## payments

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| id | uuid | PK | Định danh giao dịch thanh toán (UUID). |
| method | payment_method | not null | Phương thức thanh toán (`cash`/`QR`/`card`). |
| amount | int | not null | Số tiền thanh toán. |
| qrCode | varchar |  | Nội dung/chuỗi QR (nếu có). |
| qrCodePublicId | varchar |  | Public ID QR trên Cloudinary (nếu có). |
| orderCode | varchar |  | Mã đơn liên quan (phục vụ đối soát/nhận webhook). |
| orderId | uuid | FK -> orders.id, delete: cascade | Khóa ngoại tới đơn hàng; xóa đơn sẽ xóa các payment. |
| createdAt | timestamp |  | Thời điểm tạo bản ghi. |
| updateAt | timestamp |  | Thời điểm cập nhật bản ghi. |
| deletedAt | timestamp |  | Thời điểm xóa mềm. |

## tax_and_discount

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| id | uuid | PK | Định danh thuế/giảm giá (UUID). |
| name | varchar | not null | Tên thuế/giảm giá. |
| description | varchar |  | Mô tả chi tiết. |
| percent | decimal(10,2) | not null | Phần trăm thuế/giảm giá. |
| type | tax_discount_type | default: 'tax' | Loại: `tax` hoặc `discount`. |
| isActive | boolean | default: true | Cờ bật/tắt áp dụng. |
| applyFrom | timestamp |  | Thời điểm bắt đầu áp dụng. |
| applyTo | timestamp |  | Thời điểm kết thúc áp dụng. |
| createdAt | timestamp |  | Thời điểm tạo bản ghi. |
| updatedAt | timestamp |  | Thời điểm cập nhật bản ghi. |
| deletedAt | timestamp |  | Thời điểm xóa mềm. |

## order_tax_discount

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| orderId | uuid | PK, FK -> orders.id | Khóa tới đơn hàng (bảng nối). |
| taxDiscountId | uuid | PK, FK -> tax_and_discount.id | Khóa tới thuế/giảm giá (bảng nối). |

## token_blacklist

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| id | uuid | PK | Định danh bản ghi blacklist (UUID). |
| token | text | unique | JWT bị đưa vào danh sách chặn. |
| expiresAt | timestamp | not null | Thời điểm token hết hạn (phục vụ dọn dẹp). |
| userId | uuid |  | Định danh user liên quan (nếu lưu). |
| createdAt | timestamp |  | Thời điểm tạo bản ghi. |

## webhooks

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| id | int | PK, increment | Khóa chính tự tăng. |
| webhookId | varchar |  | ID webhook từ bên thứ ba (nếu có). |
| orderCode | varchar |  | Mã đơn được nhắc tới trong webhook. |
| rawData | jsonb |  | Payload gốc của webhook. |
| processed | boolean | default: false | Đánh dấu webhook đã xử lý hay chưa. |
| processedAt | timestamp |  | Thời điểm xử lý thành công. |
| errorMessage | text |  | Thông tin lỗi khi xử lý (nếu có). |
| createdAt | timestamp |  | Thời điểm nhận/lưu webhook. |

## log

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| id | uuid | PK | Định danh log (UUID). |
| userId | varchar | not null | ID người dùng thực hiện hành động (dạng chuỗi). |
| userName | varchar |  | Tên người dùng tại thời điểm log. |
| userRole | role |  | Vai trò người dùng tại thời điểm log. |
| action | log_action | not null | Hành động (CREATE/READ/UPDATE/DELETE/IMPORT/EXPORT/LOGIN/LOGOUT/ERROR). |
| entityType | varchar | not null | Loại entity/đối tượng bị tác động. |
| entityId | varchar |  | ID đối tượng bị tác động. |
| entityName | varchar |  | Tên đối tượng bị tác động. |
| message | text |  | Thông điệp log. |
| metadata | jsonb |  | Metadata bổ sung (dạng JSON). |
| createdAt | timestamp |  | Thời điểm ghi log. |

## statistics

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| id | uuid | PK | Định danh bản ghi thống kê (UUID). |
| date | date | not null | Ngày mốc của thống kê. |
| period | statistic_period | not null | Chu kỳ thống kê (daily/weekly/monthly/custom). |
| startDate | date |  | Ngày bắt đầu của kỳ (nếu có). |
| endDate | date |  | Ngày kết thúc của kỳ (nếu có). |
| totalRevenue | decimal(12,2) | default: 0 | Tổng doanh thu. |
| totalOrders | int | default: 0 | Tổng số đơn. |
| averageOrderValue | decimal(12,2) | default: 0 | Giá trị đơn trung bình. |
| totalProductsSold | int | default: 0 | Tổng số sản phẩm bán ra. |
| topProducts | jsonb |  | Danh sách sản phẩm bán chạy (JSON). |
| dailyBreakdown | jsonb |  | Chi tiết theo ngày cho báo cáo tuần/tháng (JSON). |
| createdAt | timestamp |  | Thời điểm tạo bản ghi. |
| updatedAt | timestamp |  | Thời điểm cập nhật bản ghi. |
| deletedAt | timestamp |  | Thời điểm xóa mềm. |
