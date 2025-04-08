'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFormStore } from "@/stores/formStore";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// Define Zod schema for this step's data
const genderSchema = z.object({
  gender: z.enum(["male", "female"], {
    required_error: "Please select your gender.",
  }),
});

type GenderFormData = z.infer<typeof genderSchema>;

const genderOptions = [
    { value: "female", label: "Female" },
    { value: "male", label: "Male" },
];


export default function Step1Gender() {
  // Use the simplified store
  const formData = useFormStore((state) => state.formData);
  const updateFormData = useFormStore((state) => state.updateFormData);
  const nextStep = useFormStore((state) => state.nextStep);

  const form = useForm<GenderFormData>({
    resolver: zodResolver(genderSchema),
    defaultValues: { gender: formData.gender || undefined },
  });

  const onSubmit = (data: GenderFormData) => {
    updateFormData({ gender: data.gender });
    nextStep();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-lg font-semibold">Select Your Gender</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => {
                      // Update RHF state first
                      field.onChange(value);
                      // Then update Zustand store directly
                      if (value) { // Ensure value is valid before updating
                        updateFormData({ gender: value as 'male' | 'female' });
                      }
                    }}
                    value={field.value} // Controlled by RHF
                    className="flex flex-col space-y-3"
                  >
                    {genderOptions.map((option) => (
                      <Label 
                        key={option.value}
                        htmlFor={`gender-${option.value}`}
                        className="flex items-center space-x-3 p-4 border rounded-md cursor-pointer hover:bg-accent transition-colors has-[input:checked]:border-primary has-[input:checked]:bg-primary/10"
                      >
                        <RadioGroupItem value={option.value} id={`gender-${option.value}`} />
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
        <Button type="submit" className="w-full">Continue</Button>
      </form>
    </Form>
  );
} 