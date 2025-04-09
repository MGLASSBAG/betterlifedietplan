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

// Schema for Step 2
const FormSchema = z.object({
  familiarity: z.enum(['beginner', 'somewhat_familiar', 'expert'], {
    required_error: "Please select your familiarity level."
  }),
});

type FormData = z.infer<typeof FormSchema>;

const familiarityOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'somewhat_familiar', label: 'Somewhat Familiar' },
  { value: 'expert', label: 'Expert' },
];

type Step2FamiliarityProps = {
  setSubmitHandler: (handler: () => Promise<boolean>) => void;
  isSubmitting: boolean;
};

export default function Step2Familiarity({ setSubmitHandler, isSubmitting }: Step2FamiliarityProps) {
  const formData = useFormStore((state) => state.formData);
  const updateFormData = useFormStore((state) => state.updateFormData);
  const nextStep = useFormStore((state) => state.nextStep);

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      familiarity: formData.familiarity || undefined,
    },
    mode: 'onChange',
  });

  const handleValidSubmit = (data: FormData) => {
    updateFormData({ familiarity: data.familiarity });
    nextStep();
  };

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
            name="familiarity"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-lg font-semibold">How familiar are you with the Keto diet?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex flex-col space-y-3"
                    disabled={isSubmitting}
                  >
                    {familiarityOptions.map((option) => (
                      <Label 
                        key={option.value}
                        htmlFor={`familiarity-${option.value}`}
                        className={`flex items-center space-x-3 p-4 border rounded-md transition-colors ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-accent has-[input:checked]:border-primary has-[input:checked]:bg-primary/10'}`}
                      >
                        <RadioGroupItem 
                          value={option.value} 
                          id={`familiarity-${option.value}`} 
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