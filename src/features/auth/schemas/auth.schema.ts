import * as z from 'zod';

// Validation schemas with Zod
export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Vui lòng nhập email hoặc số điện thoại'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Vui lòng nhập họ và tên đầy đủ'),
  phone: z.string().trim().min(1, 'Vui lòng nhập số điện thoại'),
  email: z.string().trim().refine(
    (value) => !value || z.string().email().safeParse(value).success,
    'Địa chỉ email không đúng định dạng',
  ),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

