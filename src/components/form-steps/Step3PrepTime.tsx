'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFormStore } from '@/stores/formStore';
import { useCallback } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// Schema for Step 3
const FormSchema = z.object({
  prep_time: z.enum(['15_mins', '30_mins', '60_plus_mins'], {
    required_error: "Please select your available prep time."
  }),
});

type FormData = z.infer<typeof FormSchema>;

const prepTimeOptions = [
  { value: '15_mins', label: '15 mins' },
  { value: '30_mins', label: '30 mins' },
  { value: '60_plus_mins', label: '60+ mins' },
];

export default function Step3PrepTime() {
  // Get data and update function from the store
  const formData = useFormStore(useCallback((state) => state.formData, []));
  const updateFormData = useFormStore(useCallback((state) => state.updateFormData, []));
  const nextStep = useFormStore(useCallback((state) => state.nextStep, []));

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      prep_time: formData.prep_time || undefined,
    },
  });

  const onSubmit = (data: FormData) => {
    updateFormData({ prep_time: data.prep_time });
    nextStep();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="prep_time"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-lg font-semibold">How much time do you have for meal preparation each day?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => {
                      field.onChange(value);
                      updateFormData({ prep_time: value as '15_mins' | '30_mins' | '60_plus_mins' });
                    }}
                    value={field.value}
                    className="flex flex-col space-y-3"
                  >
                    {prepTimeOptions.map((option) => (
                      <Label 
                        key={option.value}
                        htmlFor={`prep-time-${option.value}`}
                        className="flex items-center space-x-3 p-4 border rounded-md cursor-pointer hover:bg-accent transition-colors has-[input:checked]:border-primary has-[input:checked]:bg-primary/10"
                      >
                        <RadioGroupItem value={option.value} id={`prep-time-${option.value}`} />
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