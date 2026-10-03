import { useState } from "react";
import Loader from "@/components/shared/Loader";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useUserContext } from "@/context/AuthContext";
import { useSignInAccount, useResetPassword } from "@/lib/react-query/queries";
import { SigninValidation } from "@/lib/validation";
import { getFirebaseErrorMessage } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { CheckCircle2, ArrowLeft, Mail } from "lucide-react";

const SigninForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { checkAuthUser, isLoading: isUserLoading } = useUserContext();

  // Remember me / Familiar device toggle
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot password states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  // Queries
  const { mutateAsync: signInAccount, isPending } = useSignInAccount();
  const { mutateAsync: resetPassword, isPending: isResetPending } =
    useResetPassword();

  const form = useForm<z.infer<typeof SigninValidation>>({
    resolver: zodResolver(SigninValidation),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSignin = async (user: z.infer<typeof SigninValidation>) => {
    try {
      const session = await signInAccount({
        email: user.email,
        password: user.password,
        rememberMe,
      });

      if (!session) {
        toast({ title: "Login failed. Please try again." });
        return;
      }
      const isLoggedIn = await checkAuthUser();

      if (isLoggedIn) {
        form.reset();
        navigate("/");
      } else {
        toast({ title: "Login failed. Please try again." });
      }
    } catch (error: any) {
      console.error("Error during sign-in:", error);
      toast({ title: getFirebaseErrorMessage(error) });
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !resetEmail.includes("@")) {
      toast({ title: "Please enter a valid email address." });
      return;
    }

    try {
      await resetPassword(resetEmail.trim());
      setResetSent(true);
      toast({
        title: "Password reset link sent!",
        description: `Check your inbox at ${resetEmail.trim()}`,
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({ title: getFirebaseErrorMessage(error) });
    }
  };

  // If user requested Forgot Password, display the dedicated reset flow
  if (isForgotPassword) {
    return (
      <div className="sm:w-420 flex-center flex-col w-full px-4">
        <img src="/assets/images/logo.svg" alt="logo" />

        <h2 className="h3-bold md:h2-bold pt-5 sm:pt-10 text-center">
          Reset your password
        </h2>
        <p className="text-light-3 small-medium md:base-regular mt-2 text-center">
          Enter your account email and we'll send you a link to reset your password.
        </p>

        {resetSent ? (
          <div className="w-full mt-6 p-6 rounded-xl bg-dark-2 border border-dark-4 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-500/20 flex-center text-primary-500">
              <CheckCircle2 className="w-6 h-6 text-primary-500" />
            </div>
            <h3 className="base-medium text-light-1">Reset link sent!</h3>
            <p className="small-regular text-light-3">
              We sent a password reset email to{" "}
              <span className="text-primary-500 font-semibold">{resetEmail}</span>.
              Please check your inbox (and spam folder) to set a new password.
            </p>
            <Button
              type="button"
              className="shad-button_primary w-full mt-3"
              onClick={() => {
                setIsForgotPassword(false);
                setResetSent(false);
              }}
            >
              Back to Log in
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handlePasswordReset}
            className="flex flex-col gap-5 w-full mt-6"
          >
            <div className="flex flex-col gap-2">
              <label className="shad-form_label flex items-center gap-2">
                <Mail className="w-4 h-4 text-light-3" /> Email address
              </label>
              <Input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="name@example.com"
                className="shad-input"
                required
                autoFocus
              />
            </div>

            <Button
              type="submit"
              className="shad-button_primary"
              disabled={isResetPending}
            >
              {isResetPending ? (
                <div className="flex-center gap-2">
                  <Loader /> Sending link...
                </div>
              ) : (
                "Send Reset Link"
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="shad-button_ghost flex items-center gap-2 text-light-3 hover:text-light-1"
              onClick={() => setIsForgotPassword(false)}
            >
              <ArrowLeft className="w-4 h-4" /> Back to Log in
            </Button>
          </form>
        )}
      </div>
    );
  }

  return (
    <Form {...form}>
      <div className="sm:w-420 flex-center flex-col w-full px-4">
        <img src="/assets/images/logo.svg" alt="logo" />

        <h2 className="h3-bold md:h2-bold pt-5 sm:pt-12">
          Log in to your account
        </h2>
        <p className="text-light-3 small-medium md:base-regular mt-2">
          Welcome back! Please enter your details.
        </p>
        <form
          onSubmit={form.handleSubmit(handleSignin)}
          className="flex flex-col gap-5 w-full mt-4"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form_label">Email</FormLabel>
                <FormControl>
                  <Input type="text" className="shad-input" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="shad-form_label">Password</FormLabel>
                  <button
                    type="button"
                    onClick={() => {
                      const currentVal = form.getValues("email");
                      if (currentVal) setResetEmail(currentVal);
                      setIsForgotPassword(true);
                    }}
                    className="text-small-semibold text-primary-500 hover:text-primary-600 hover:underline transition-all"
                  >
                    Forgot password?
                  </button>
                </div>
                <FormControl>
                  <Input type="password" className="shad-input" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Remember me on familiar device toggle */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-dark-4 bg-dark-3 text-primary-500 focus:ring-primary-500 focus:ring-offset-dark-1 cursor-pointer accent-[#877EFF]"
            />
            <label
              htmlFor="rememberMe"
              className="text-small-medium text-light-2 cursor-pointer select-none"
            >
              Remember this device (stay logged in on familiar device)
            </label>
          </div>

          <Button type="submit" className="shad-button_primary">
            {isPending || isUserLoading ? (
              <div className="flex-center gap-2">
                <Loader /> Loading...
              </div>
            ) : (
              "Log in"
            )}
          </Button>

          <p className="text-small-regular text-light-2 text-center mt-2">
            Don&apos;t have an account?
            <Link
              to="/sign-up"
              className="text-primary-500 text-small-semibold ml-1"
            >
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </Form>
  );
};

export default SigninForm;
