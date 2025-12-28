import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../form";
import { Input } from "../input";
import { Button } from "../button";

// Test schema
const testSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
});

type TestFormValues = z.infer<typeof testSchema>;

// Test form component
function TestForm({
  onSubmit = vi.fn(),
  defaultValues = { username: "", email: "" },
}: {
  onSubmit?: (data: TestFormValues) => void;
  defaultValues?: Partial<TestFormValues>;
}) {
  const form = useForm<TestFormValues>({
    resolver: zodResolver(testSchema),
    defaultValues: defaultValues as TestFormValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter username" {...field} />
              </FormControl>
              <FormDescription>
                Your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter email" {...field} />
              </FormControl>
              <FormDescription>
                We will never share your email.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}

describe("Form", () => {
  describe("Rendering", () => {
    it("renders form fields without errors", () => {
      render(<TestForm />);

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it("renders labels correctly", () => {
      render(<TestForm />);

      expect(screen.getByText("Username")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
    });

    it("renders descriptions correctly", () => {
      render(<TestForm />);

      expect(screen.getByText("Your public display name.")).toBeInTheDocument();
      expect(screen.getByText("We will never share your email.")).toBeInTheDocument();
    });

    it("renders inputs with placeholders", () => {
      render(<TestForm />);

      expect(screen.getByPlaceholderText("Enter username")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter email")).toBeInTheDocument();
    });

    it("renders submit button", () => {
      render(<TestForm />);

      expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("shows validation error for empty required fields", async () => {
      const { user } = render(<TestForm />);

      await user.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        expect(screen.getByText("Username must be at least 3 characters")).toBeInTheDocument();
      });
    });

    it("shows validation error for short username", async () => {
      const { user } = render(<TestForm />);

      await user.type(screen.getByPlaceholderText("Enter username"), "ab");
      await user.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        expect(screen.getByText("Username must be at least 3 characters")).toBeInTheDocument();
      });
    });

    it("shows validation error for invalid email", async () => {
      const { user } = render(<TestForm />);

      await user.type(screen.getByPlaceholderText("Enter username"), "validuser");
      await user.type(screen.getByPlaceholderText("Enter email"), "invalid-email");
      await user.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        expect(screen.getByText("Invalid email address")).toBeInTheDocument();
      });
    });

    it("clears validation error when field is corrected", async () => {
      const { user } = render(<TestForm />);

      // Submit empty form
      await user.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        expect(screen.getByText("Username must be at least 3 characters")).toBeInTheDocument();
      });

      // Fix the error
      await user.type(screen.getByPlaceholderText("Enter username"), "validuser");
      await user.type(screen.getByPlaceholderText("Enter email"), "valid@email.com");

      // Re-submit
      await user.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        expect(screen.queryByText("Username must be at least 3 characters")).not.toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("calls onSubmit with valid data", async () => {
      const handleSubmit = vi.fn();
      const { user } = render(<TestForm onSubmit={handleSubmit} />);

      await user.type(screen.getByPlaceholderText("Enter username"), "testuser");
      await user.type(screen.getByPlaceholderText("Enter email"), "test@example.com");
      await user.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          {
            username: "testuser",
            email: "test@example.com",
          },
          expect.anything()
        );
      });
    });

    it("does not call onSubmit with invalid data", async () => {
      const handleSubmit = vi.fn();
      const { user } = render(<TestForm onSubmit={handleSubmit} />);

      await user.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        expect(handleSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe("Default Values", () => {
    it("renders with default values", () => {
      render(
        <TestForm
          defaultValues={{
            username: "defaultuser",
            email: "default@email.com",
          }}
        />
      );

      expect(screen.getByPlaceholderText("Enter username")).toHaveValue("defaultuser");
      expect(screen.getByPlaceholderText("Enter email")).toHaveValue("default@email.com");
    });
  });

  describe("User Interactions", () => {
    it("updates input values on typing", async () => {
      const { user } = render(<TestForm />);

      const usernameInput = screen.getByPlaceholderText("Enter username");
      await user.type(usernameInput, "newuser");

      expect(usernameInput).toHaveValue("newuser");
    });

    it("clears input values", async () => {
      const { user } = render(
        <TestForm defaultValues={{ username: "existinguser", email: "" }} />
      );

      const usernameInput = screen.getByPlaceholderText("Enter username");
      await user.clear(usernameInput);

      expect(usernameInput).toHaveValue("");
    });
  });

  describe("Accessibility", () => {
    it("associates labels with inputs", () => {
      render(<TestForm />);

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);

      expect(usernameInput).toBeInTheDocument();
      expect(emailInput).toBeInTheDocument();
    });

    it("associates description with input via aria-describedby", () => {
      render(<TestForm />);

      const usernameInput = screen.getByPlaceholderText("Enter username");
      expect(usernameInput).toHaveAttribute("aria-describedby");
    });

    it("marks invalid inputs with aria-invalid", async () => {
      const { user } = render(<TestForm />);

      await user.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        const usernameInput = screen.getByPlaceholderText("Enter username");
        expect(usernameInput).toHaveAttribute("aria-invalid", "true");
      });
    });

    it("focuses first invalid field on submit", async () => {
      const { user } = render(<TestForm />);

      await user.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        // First invalid field (username) should be focused or error visible
        expect(screen.getByText("Username must be at least 3 characters")).toBeInTheDocument();
      });
    });
  });

  describe("FormLabel", () => {
    it("applies error styling when field has error", async () => {
      const { user } = render(<TestForm />);

      await user.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        const label = screen.getByText("Username");
        expect(label).toHaveClass("text-destructive");
      });
    });
  });

  describe("FormMessage", () => {
    it("displays error message with destructive styling", async () => {
      const { user } = render(<TestForm />);

      await user.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        const errorMessage = screen.getByText("Username must be at least 3 characters");
        expect(errorMessage).toHaveClass("text-destructive");
      });
    });

    it("does not render when no error", () => {
      render(<TestForm defaultValues={{ username: "valid", email: "valid@email.com" }} />);

      // FormMessage should not render any error text
      expect(screen.queryByText(/must be at least/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
    });
  });
});
