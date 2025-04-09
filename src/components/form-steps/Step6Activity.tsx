'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFormStore } from '@/stores/formStore';
import { useCallback, useEffect } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";

// Schema for Step 6
const FormSchema = z.object({
  activity_level: z.enum(['not_active', 'moderately_active', 'very_active'], {
    required_error: "Please select your activity level."
  }),
});

type FormData = z.infer<typeof FormSchema>;

const activityOptions = [
  { value: 'not_active', label: 'Not Active (Sedentary lifestyle)' },
  { value: 'moderately_active', label: 'Moderately Active (Exercise 1-3 times/week)' },
  { value: 'very_active', label: 'Very Active (Exercise 4+ times/week)' },
];

type Step6ActivityProps = {
  setSubmitHandler: (handler: () => Promise<boolean>) => void;
  isSubmitting: boolean;
};

export default function Step6Activity({ setSubmitHandler, isSubmitting }: Step6ActivityProps) {
  const formData = useFormStore(useCallback((state) => state.formData, []));
  const updateFormData = useFormStore(useCallback((state) => state.updateFormData, []));
  const nextStep = useFormStore(useCallback((state) => state.nextStep, []));

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      activity_level: formData.activity_level || undefined,
    },
    mode: 'onChange',
  });

  // This function is called ONLY if validation passes
  const handleValidSubmit = (data: FormData) => {
    updateFormData({ activity_level: data.activity_level });
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
            name="activity_level"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-lg font-semibold">How physically active are you?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex flex-col space-y-3"
                    disabled={isSubmitting}
                  >
                    {activityOptions.map((option) => (
                      <Label 
                        key={option.value}
                        htmlFor={`activity-${option.value}`}
                        className={`flex items-center space-x-3 p-4 border rounded-md transition-colors ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-accent has-[input:checked]:border-primary has-[input:checked]:bg-primary/10'}`}
                      >
                        <RadioGroupItem 
                          value={option.value} 
                          id={`activity-${option.value}`} 
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