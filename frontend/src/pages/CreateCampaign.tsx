import { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Textarea,
  VStack,
  useToast,
  Progress,
  Text,
  Alert,
  AlertIcon,
  HStack,
  Badge,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import api from "@/services/api";
import FileUploader from "@/components/ui/FileUploader";
import RiskScoreBadge from "@/components/ui/RiskScoreBadge";

const schema = z.object({
  title: z.string().min(8, "Title must be at least 8 characters"),
  description: z.string().min(50, "Please provide more details"),
  patientAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  hospitalAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  goalAmount: z.string().regex(/^\d+(\.\d+)?$/, "Must be a valid number"),
});

type FormData = z.infer<typeof schema>;

export default function CreateCampaign() {
  const [files, setFiles] = useState<File[]>([]);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const verifyMutation = useMutation({
    mutationFn: async (formFiles: File[]) => {
      const fd = new FormData();
      formFiles.forEach((file) => fd.append("documents", file));

      const res = await fetch("http://localhost:8001/verify", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) throw new Error("Verification service unavailable");
      return res.json();
    },
    onSuccess: (data) => {
      setVerificationResult(data);
      toast({
        title: data.verdict,
        description: `Risk score: ${data.riskScore}/100`,
        status:
          data.riskScore < 40
            ? "success"
            : data.riskScore < 70
              ? "warning"
              : "error",
        duration: 8000,
      });
    },
    onError: () => {
      toast({ title: "Verification failed", status: "error" });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData & { riskScore: number }) =>
      api.post("/campaigns", data),
    onSuccess: (res) => {
      toast({
        title: "Campaign launched!",
        description: `Contract address: ${res.data.contractAddress}`,
        status: "success",
      });
      // reset form or redirect
    },
  });

  const onSubmit = (data: FormData) => {
    if (!verificationResult || verificationResult.riskScore > 60) {
      toast({
        title: "Document verification required or too risky",
        status: "warning",
      });
      return;
    }
    createMutation.mutate({ ...data, riskScore: verificationResult.riskScore });
  };

  return (
    <Box maxW="container.md" mx="auto" py={10}>
      <Heading mb={8}>Create Medical Crowdfunding Campaign</Heading>

      <form onSubmit={handleSubmit(onSubmit)}>
        <VStack spacing={6} align="stretch">
          <FormControl isInvalid={!!errors.title}>
            <FormLabel>Campaign Title</FormLabel>
            <Input
              {...register("title")}
              placeholder="Urgent heart surgery for 12-year-old"
            />
            <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.description}>
            <FormLabel>Description & Medical Need</FormLabel>
            <Textarea
              {...register("description")}
              rows={6}
              placeholder="Detailed story..."
            />
            <FormErrorMessage>{errors.description?.message}</FormErrorMessage>
          </FormControl>

          <HStack spacing={6} align="start">
            <FormControl isInvalid={!!errors.patientAddress}>
              <FormLabel>
                Patient Ethereum Address (for receiving funds)
              </FormLabel>
              <Input {...register("patientAddress")} placeholder="0x..." />
              <FormErrorMessage>
                {errors.patientAddress?.message}
              </FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.hospitalAddress}>
              <FormLabel>
                Hospital Ethereum Address (for milestone confirmation)
              </FormLabel>
              <Input {...register("hospitalAddress")} placeholder="0x..." />
              <FormErrorMessage>
                {errors.hospitalAddress?.message}
              </FormErrorMessage>
            </FormControl>
          </HStack>

          <FormControl isInvalid={!!errors.goalAmount}>
            <FormLabel>Goal Amount (ETH)</FormLabel>
            <Input {...register("goalAmount")} placeholder="2.5" />
            <FormErrorMessage>{errors.goalAmount?.message}</FormErrorMessage>
          </FormControl>

          <Box>
            <FormLabel>Upload Medical Documents (PDF, JPG, PNG)</FormLabel>
            <FileUploader
              onFilesChange={setFiles}
              maxFiles={5}
              accept="image/*,application/pdf"
              isDisabled={verifyMutation.isPending}
            />
          </Box>

          <Button
            colorScheme="blue"
            onClick={() => files.length > 0 && verifyMutation.mutate(files)}
            isLoading={verifyMutation.isPending}
            isDisabled={files.length === 0 || verifyMutation.isPending}
          >
            Verify Documents
          </Button>

          {verificationResult && (
            <Alert
              status={
                verificationResult.riskScore < 40
                  ? "success"
                  : verificationResult.riskScore < 70
                    ? "warning"
                    : "error"
              }
              variant="subtle"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              py={6}
            >
              <AlertIcon boxSize={10} />
              <Text fontSize="xl" mt={4} fontWeight="bold">
                {verificationResult.verdict}
              </Text>
              <RiskScoreBadge
                score={verificationResult.riskScore}
                mt={4}
                size="lg"
              />
              <Text mt={2} fontSize="sm" opacity={0.9}>
                {verificationResult.details?.join(" • ")}
              </Text>
            </Alert>
          )}

          <Button
            type="submit"
            colorScheme="brand"
            size="lg"
            isLoading={createMutation.isPending || isSubmitting}
            isDisabled={
              !verificationResult ||
              verificationResult.riskScore > 60 ||
              createMutation.isPending
            }
          >
            Launch Campaign
          </Button>
        </VStack>
      </form>
    </Box>
  );
}
