'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFormStore } from '@/stores/formStore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useEffect } from "react";
import { toast } from "react-hot-toast";

// Schema for Step 3
const FormSchema = z.object({
  prep_time: z.enum(['15_mins', '30_mins', '60_plus_mins'], {
    required_error: "Please select your preferred meal prep time."
  }),
});

type FormData = z.infer<typeof FormSchema>;

const prepTimeOptions = [
  { value: '15_mins', label: 'Up to 15 minutes' },
  { value: '30_mins', label: 'Up to 30 minutes' },
  { value: '60_plus_mins', label: '60 minutes or more' },
];

type Step3PrepTimeProps = {
  setSubmitHandler: (handler: () => Promise<boolean>) => void;
  isSubmitting: boolean;
};

export default function Step3PrepTime({ setSubmitHandler, isSubmitting }: Step3PrepTimeProps) {
  const formData = useFormStore((state) => state.formData);
  const updateFormData = useFormStore((state) => state.updateFormData);
  const nextStep = useFormStore((state) => state.nextStep);

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      prep_time: formData.prep_time || undefined,
    },
    mode: 'onChange',
  });

  // This function is called ONLY if validation passes
  const handleValidSubmit = (data: FormData) => {
    updateFormData({ prep_time: data.prep_time });
    nextStep();
  };

  // Register the validation/submit handler with the parent component
  useEffect(() => {
    setSubmitHandler(async () => {
      const isValid = await form.trigger();
      if (isValid) {
        await form.handleSubmit(handleValidSubmit)();
        return true;
      } else {
        const errorField = Object.keys(form.formState.errors)[0] as keyof FormData;
        if (errorField && form.formState.errors[errorField]?.message) {
           toast.error(form.formState.errors[errorField]?.message ?? "Please fix the errors.");
        } else {
           toast.error("Please select an option.");
        }
        return false;
      }
    });
  }, [setSubmitHandler, form, handleValidSubmit]);

  return (
    <Form {...form}>
      <form className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="prep_time"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-lg font-semibold">How much time are you willing to spend on meal prep?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex flex-col space-y-3"
                    disabled={isSubmitting}
                  >
                    {prepTimeOptions.map((option) => (
                      <Label 
                        key={option.value}
                        htmlFor={`prep_time-${option.value}`}
                        className={`flex items-center space-x-3 p-4 border rounded-md transition-colors ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-accent has-[input:checked]:border-primary has-[input:checked]:bg-primary/10'}`}
                      >
                        <RadioGroupItem 
                          value={option.value} 
                          id={`prep_time-${option.value}`} 
                          disabled={isSubmitting}
                         />
                        <span className="font-normal">{option.label}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
} 