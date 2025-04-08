'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFormStore } from '@/stores/formStore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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

export default function Step2Familiarity() {
  // Get data and update function from the store
  const formData = useFormStore((state) => state.formData);
  const updateFormData = useFormStore((state) => state.updateFormData);
  const nextStep = useFormStore((state) => state.nextStep);

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      familiarity: formData.familiarity || undefined,
    },
  });

  const onSubmit = (data: FormData) => {
    updateFormData({ familiarity: data.familiarity });
    nextStep();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="familiarity"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-lg font-semibold">How familiar are you with the Keto diet?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => {
                      field.onChange(value);
                      updateFormData({ familiarity: value as 'beginner' | 'somewhat_familiar' | 'expert' });
                    }}
                    value={field.value}
                    className="flex flex-col space-y-3"
                  >
                    {familiarityOptions.map((option) => (
                      <Label 
                        key={option.value}
                        htmlFor={`familiarity-${option.value}`}
                        className="flex items-center space-x-3 p-4 border rounded-md cursor-pointer hover:bg-accent transition-colors has-[input:checked]:border-primary has-[input:checked]:bg-primary/10"
                      >
                        <RadioGroupItem value={option.value} id={`familiarity-${option.value}`} />
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
        <Button 
          type="submit" 
          className="w-full bg-red-600 hover:bg-red-700"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Processing...' : 'Continue'}
        </Button>
      </form>
    </Form>
  );
} 