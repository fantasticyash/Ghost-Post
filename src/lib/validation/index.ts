import { z } from "zod";
export const SignupValidation = z.object({
  name: z.string().min(2, { message: "TooShort" }),
  username: z.string().min(2, { message: "Too Short" }),
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().min(8, { message: "Too Short" }),
});

export const SigninValidation = z.object({
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().min(8, { message: "Too Short" }),
});
export const PostValidation = z.object({
  caption: z.string().min(2).max(2200),
  file: z.array(z.any()),
  location: z.string().min(2).max(200),
  tags: z.string().min(2).max(200),
});

export const ProfileValidation = z.object({
  file: z.custom<File[]>(),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  username: z
    .string()
    .min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email(),
  bio: z.string(),
});
