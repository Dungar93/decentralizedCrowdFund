import { useDropzone } from "react-dropzone";
import {
  Box,
  Text,
  Icon,
  VStack,
  Badge,
  HStack,
  Button,
} from "@chakra-ui/react";
import { FiUploadCloud, FiX } from "react-icons/fi";

interface Props {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  accept?: string;
  isDisabled?: boolean;
}

export default function FileUploader({
  onFilesChange,
  maxFiles = 5,
  accept = "image/*,application/pdf",
  isDisabled = false,
}: Props) {
  const [files, setFiles] = useState<File[]>([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { [accept]: [] },
    maxFiles,
    disabled: isDisabled,
    onDrop: (acceptedFiles) => {
      const newFiles = [...files, ...acceptedFiles];
      setFiles(newFiles);
      onFilesChange(newFiles);
    },
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  return (
    <Box>
      <Box
        {...getRootProps()}
        border="2px dashed"
        borderColor={isDragActive ? "brand.500" : "gray.300"}
        borderRadius="lg"
        p={10}
        textAlign="center"
        bg={isDragActive ? "brand.50" : "gray.50"}
        _dark={{
          bg: isDragActive ? "brand.900" : "gray.800",
          borderColor: isDragActive ? "brand.400" : "gray.600",
        }}
        cursor={isDisabled ? "not-allowed" : "pointer"}
        opacity={isDisabled ? 0.6 : 1}
      >
        <input {...getInputProps()} />
        <VStack spacing={3}>
          <Icon as={FiUploadCloud} boxSize={10} color="gray.500" />
          <Text fontWeight="medium">
            {isDragActive
              ? "Drop files here..."
              : "Drag & drop documents or click to select"}
          </Text>
          <Text fontSize="sm" color="gray.500">
            PDF, JPG, PNG • Max {maxFiles} files
          </Text>
        </VStack>
      </Box>

      {files.length > 0 && (
        <Box mt={6}>
          <Text fontWeight="medium" mb={2}>
            Uploaded files:
          </Text>
          <VStack align="stretch" spacing={2}>
            {files.map((file, idx) => (
              <HStack
                key={idx}
                justify="space-between"
                p={3}
                bg="gray.100"
                borderRadius="md"
                _dark={{ bg: "gray.700" }}
              >
                <Text isTruncated maxW="80%">
                  {file.name}
                </Text>
                <HStack>
                  <Badge colorScheme="blue">
                    {(file.size / 1024).toFixed(1)} KB
                  </Badge>
                  <Button
                    size="xs"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => removeFile(idx)}
                  >
                    <Icon as={FiX} />
                  </Button>
                </HStack>
              </HStack>
            ))}
          </VStack>
        </Box>
      )}
    </Box>
  );
}
