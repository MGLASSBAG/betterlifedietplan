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
import { useEffect } from "react";
import { toast } from "react-hot-toast";

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

type Step1GenderProps = {
  setSubmitHandler: (handler: () => Promise<boolean>) => void;
  isSubmitting: boolean;
};

export default function Step1Gender({ setSubmitHandler, isSubmitting }: Step1GenderProps) {
  const formData = useFormStore((state) => state.formData);
  const updateFormData = useFormStore((state) => state.updateFormData);
  const nextStep = useFormStore((state) => state.nextStep);

  const form = useForm<GenderFormData>({
    resolver: zodResolver(genderSchema),
    defaultValues: { gender: formData.gender || undefined },
    mode: 'onChange',
  });

  const handleValidSubmit = (data: GenderFormData) => {
    updateFormData({ gender: data.gender });
    nextStep();
  };

  useEffect(() => {
    setSubmitHandler(async () => {
      const isValid = await form.trigger();
      if (isValid) {
        await form.handleSubmit(handleValidSubmit)();
        return true;
      } else {
        const errorField = Object.keys(form.formState.errors)[0] as keyof GenderFormData;
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
            name="gender"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-lg font-semibold">Select Your Gender</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => {
                      field.onChange(value);
                    }}
                    value={field.value}
                    className="flex flex-col space-y-3"
                    disabled={isSubmitting}
                  >
                    {genderOptions.map((option) => (
                      <Label 
                        key={option.value}
                        htmlFor={`gender-${option.value}`}
                        className={`flex items-center space-x-3 p-4 border rounded-md transition-colors ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-accent has-[input:checked]:border-primary has-[input:checked]:bg-primary/10'}`}
                      >
                        <RadioGroupItem 
                          value={option.value} 
                          id={`gender-${option.value}`} 
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