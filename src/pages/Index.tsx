import { useState } from "react";
import { Building2, Sparkles, Download, Loader2, Upload, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { generateAd, fileToDataUrl, type AdFormat, type GenerateAdInput } from "@/lib/api";

const initialState: GenerateAdInput = {
  companyName: "",
  agentName: "",
  agentPhone: "",
  propertyType: "Apartment",
  listingType: "For Sale",
  price: "",
  location: "",
  size: "",
  bedrooms: "",
  bathrooms: "",
  highlights: ["", "", ""],
  description: "",
  format: "square",
  style: "luxury-modern",
  photos: [],
};

const formatLabels: Record<AdFormat, string> = {
  square: "Square 1:1 (Instagram)",
  portrait: "Portrait 4:5 (Story)",
  landscape: "Landscape 16:9 (Banner)",
};

const formatAspect: Record<AdFormat, string> = {
  square: "aspect-square",
  portrait: "aspect-[4/5]",
  landscape: "aspect-video",
};

export default function Index() {
  const [form, setForm] = useState<GenerateAdInput>(initialState);
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const update = <K extends keyof GenerateAdInput>(key: K, value: GenerateAdInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setHighlight = (i: number, value: string) =>
    setForm((f) => {
      const next = [...f.highlights];
      next[i] = value;
      return { ...f, highlights: next };
    });

  const handlePhotos = async (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 4 - form.photos.length);
    const dataUrls = await Promise.all(arr.map(fileToDataUrl));
    update("photos", [...form.photos, ...dataUrls]);
  };

  const removePhoto = (idx: number) =>
    update(
      "photos",
      form.photos.filter((_, i) => i !== idx),
    );

  const handleGenerate = async () => {
    if (!form.companyName.trim() || !form.location.trim()) {
      toast.error("Please fill in at least Company Name and Location.");
      return;
    }
    setLoading(true);
    setResultImage(null);
    try {
      const { image } = await generateAd(form);
      setResultImage(image);
      toast.success("Your ad is ready!");
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate ad. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!resultImage) return;
    const a = document.createElement("a");
    a.href = resultImage;
    a.download = `estatead-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-primary rounded-xl p-2 shadow-glow">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-primary leading-none">EstateAd Studio</h1>
              <p className="text-xs text-muted-foreground mt-0.5">AI-powered real-estate ads</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-accent" />
            <span>Powered by Gemini Nano Banana</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-10 md:py-14 text-center animate-fade-in">
        <h2 className="font-display text-3xl md:text-5xl font-bold text-primary tracking-tight max-w-3xl mx-auto">
          Turn property details into{" "}
          <span className="bg-gradient-primary bg-clip-text text-transparent">stunning ad posts</span>
        </h2>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-base md:text-lg">
          Fill the form, drop in a few photos, and get a polished, share-ready advertisement in seconds.
        </p>
      </section>

      {/* Main grid */}
      <main className="container pb-20 grid lg:grid-cols-5 gap-6 lg:gap-8">
        {/* Form */}
        <Card className="lg:col-span-3 p-6 md:p-8 shadow-elegant border-border/60">
          <h3 className="font-display text-xl font-bold text-primary mb-6">Listing details</h3>

          {/* Brand */}
          <SectionTitle>Brand & contact</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <Field label="Company name *">
              <Input
                placeholder="Skyline Realty"
                value={form.companyName}
                onChange={(e) => update("companyName", e.target.value)}
              />
            </Field>
            <Field label="Agent name">
              <Input
                placeholder="Jane Doe"
                value={form.agentName}
                onChange={(e) => update("agentName", e.target.value)}
              />
            </Field>
            <Field label="Contact phone / email">
              <Input
                placeholder="+1 555 123 4567"
                value={form.agentPhone}
                onChange={(e) => update("agentPhone", e.target.value)}
              />
            </Field>
            <Field label="Listing type">
              <Select value={form.listingType} onValueChange={(v) => update("listingType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["For Sale", "For Rent", "New Launch", "Open House", "Just Sold"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Property */}
          <SectionTitle>Property</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <Field label="Property type">
              <Select value={form.propertyType} onValueChange={(v) => update("propertyType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Apartment", "House", "Villa", "Condo", "Townhouse", "Penthouse", "Studio", "Land", "Commercial"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Price">
              <Input
                placeholder="$1,250,000"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
              />
            </Field>
            <Field label="Location *">
              <Input
                placeholder="Downtown Manhattan, NY"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
              />
            </Field>
            <Field label="Size">
              <Input
                placeholder="1,800 sq ft"
                value={form.size}
                onChange={(e) => update("size", e.target.value)}
              />
            </Field>
            <Field label="Bedrooms">
              <Input
                type="number"
                min={0}
                placeholder="3"
                value={form.bedrooms}
                onChange={(e) => update("bedrooms", e.target.value)}
              />
            </Field>
            <Field label="Bathrooms">
              <Input
                type="number"
                min={0}
                placeholder="2"
                value={form.bathrooms}
                onChange={(e) => update("bathrooms", e.target.value)}
              />
            </Field>
          </div>

          {/* Highlights */}
          <SectionTitle>Top highlights (up to 3)</SectionTitle>
          <div className="grid sm:grid-cols-3 gap-3 mb-6">
            {form.highlights.map((h, i) => (
              <Input
                key={i}
                placeholder={["Rooftop pool", "City view", "Smart home"][i]}
                value={h}
                onChange={(e) => setHighlight(i, e.target.value)}
              />
            ))}
          </div>

          {/* Photos */}
          <SectionTitle>Property photos (up to 4)</SectionTitle>
          <div className="mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {form.photos.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                  <img src={src} alt={`Property ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1.5 right-1.5 bg-background/90 hover:bg-destructive hover:text-destructive-foreground rounded-full p-1 transition-smooth shadow-soft"
                    aria-label="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {form.photos.length < 4 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-accent hover:bg-secondary cursor-pointer flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-accent transition-smooth">
                  <Upload className="h-5 w-5" />
                  <span className="text-xs font-medium">Add photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handlePhotos(e.target.files)}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Description */}
          <SectionTitle>Description / additional notes</SectionTitle>
          <Textarea
            placeholder="Spacious 3BR with floor-to-ceiling windows, freshly renovated kitchen, walking distance to subway and parks…"
            rows={4}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className="mb-6"
          />

          {/* Output options */}
          <SectionTitle>Output</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <Field label="Ad format">
              <Select value={form.format} onValueChange={(v) => update("format", v as AdFormat)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(formatLabels) as AdFormat[]).map((f) => (
                    <SelectItem key={f} value={f}>{formatLabels[f]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Visual style">
              <Select value={form.style} onValueChange={(v) => update("style", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="luxury-modern">Luxury Modern</SelectItem>
                  <SelectItem value="minimal-editorial">Minimal Editorial</SelectItem>
                  <SelectItem value="warm-residential">Warm Residential</SelectItem>
                  <SelectItem value="bold-corporate">Bold Corporate</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Button
            variant="hero"
            size="lg"
            className="w-full"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Generating your ad…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Generate ad post
              </>
            )}
          </Button>
        </Card>

        {/* Preview */}
        <div className="lg:col-span-2 lg:sticky lg:top-24 self-start">
          <Card className="p-6 shadow-elegant border-border/60">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-primary">Preview</h3>
              {resultImage && (
                <Button variant="accent" size="sm" onClick={downloadImage}>
                  <Download className="h-4 w-4" /> Download
                </Button>
              )}
            </div>

            <div
              className={`${formatAspect[form.format]} w-full rounded-xl overflow-hidden bg-secondary border border-border flex items-center justify-center relative`}
            >
              {loading && (
                <div className="absolute inset-0 bg-gradient-to-r from-secondary via-background to-secondary bg-[length:200%_100%] animate-shimmer flex flex-col items-center justify-center gap-3 text-primary">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-sm font-medium">Crafting your ad…</p>
                  <p className="text-xs text-muted-foreground">This usually takes 10–25 seconds</p>
                </div>
              )}
              {!loading && resultImage && (
                <img src={resultImage} alt="Generated real-estate ad" className="w-full h-full object-cover animate-fade-in" />
              )}
              {!loading && !resultImage && (
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground p-6 text-center">
                  <ImageIcon className="h-10 w-10 opacity-40" />
                  <p className="text-sm">Your generated ad will appear here</p>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
              The backend wrapper (in <code className="text-primary">/backend</code>) calls Gemini's image
              model with your <code className="text-primary">GEMINI_API_KEY</code>. Make sure it is deployed
              and <code className="text-primary">VITE_BACKEND_URL</code> points at it.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-primary/80 uppercase tracking-wide">{label}</Label>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
      <span className="h-1 w-6 bg-gradient-primary rounded-full" />
      {children}
    </h4>
  );
}
