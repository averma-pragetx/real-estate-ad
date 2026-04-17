import { useState } from "react";
import { Building2, Sparkles, Download, Loader2, Upload, X, ImageIcon, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  square: "Square · 1:1",
  portrait: "Portrait · 4:5",
  landscape: "Landscape · 16:9",
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
    update("photos", form.photos.filter((_, i) => i !== idx));

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
    <div className="min-h-screen bg-background relative">
      {/* Decorative background */}
      <div className="absolute inset-x-0 top-0 h-[480px] bg-gradient-hero pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-[480px] grid-bg opacity-40 pointer-events-none [mask-image:linear-gradient(180deg,white,transparent)]" />

      {/* Header */}
      <header className="relative border-b border-border/60 bg-background/70 backdrop-blur-xl sticky top-0 z-20">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-primary rounded-xl p-2 shadow-glow">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-base font-bold text-primary leading-none tracking-tight">EstateAd Studio</h1>
              <p className="text-xs text-muted-foreground mt-1">AI-powered real-estate ads</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border/60 text-xs font-medium text-secondary-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>Powered by Gemini Nano Banana</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative container pt-14 pb-12 md:pt-20 md:pb-16 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-accent/20 text-xs font-semibold text-accent mb-5">
          <Wand2 className="h-3.5 w-3.5" />
          AI ad generator
        </div>
        <h2 className="font-display text-4xl md:text-6xl font-bold text-primary tracking-tight max-w-3xl mx-auto leading-[1.05]">
          Beautiful real-estate ads,<br />
          <span className="bg-gradient-primary bg-clip-text text-transparent">in one click.</span>
        </h2>
        <p className="mt-5 text-muted-foreground max-w-xl mx-auto text-base md:text-lg leading-relaxed">
          Fill the form, drop in a few photos, and get a polished, share-ready advertisement in seconds.
        </p>
      </section>

      {/* Main grid */}
      <main className="relative container pb-24 grid lg:grid-cols-5 gap-6 lg:gap-8">
        {/* Form */}
        <div className="lg:col-span-3 bg-card rounded-2xl border border-border/60 shadow-card p-6 md:p-10">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-border/60">
            <div>
              <h3 className="font-display text-xl font-bold text-primary tracking-tight">Listing details</h3>
              <p className="text-sm text-muted-foreground mt-1">Tell us about the property</p>
            </div>
            <div className="hidden sm:flex h-9 w-9 rounded-full bg-secondary items-center justify-center">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
          </div>

          {/* Brand */}
          <Section title="Brand & contact" subtitle="How buyers reach you">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Company name" required>
                <Input placeholder="Skyline Realty" value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
              </Field>
              <Field label="Agent name">
                <Input placeholder="Jane Doe" value={form.agentName} onChange={(e) => update("agentName", e.target.value)} />
              </Field>
              <Field label="Contact phone / email">
                <Input placeholder="+1 555 123 4567" value={form.agentPhone} onChange={(e) => update("agentPhone", e.target.value)} />
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
          </Section>

          {/* Property */}
          <Section title="Property" subtitle="The basics">
            <div className="grid sm:grid-cols-2 gap-4">
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
                <Input placeholder="$1,250,000" value={form.price} onChange={(e) => update("price", e.target.value)} />
              </Field>
              <Field label="Location" required>
                <Input placeholder="Downtown Manhattan, NY" value={form.location} onChange={(e) => update("location", e.target.value)} />
              </Field>
              <Field label="Size">
                <Input placeholder="1,800 sq ft" value={form.size} onChange={(e) => update("size", e.target.value)} />
              </Field>
              <Field label="Bedrooms">
                <Input type="number" min={0} placeholder="3" value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)} />
              </Field>
              <Field label="Bathrooms">
                <Input type="number" min={0} placeholder="2" value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value)} />
              </Field>
            </div>
          </Section>

          {/* Highlights */}
          <Section title="Top highlights" subtitle="Up to 3 standout features">
            <div className="grid sm:grid-cols-3 gap-3">
              {form.highlights.map((h, i) => (
                <Input
                  key={i}
                  placeholder={["Rooftop pool", "City view", "Smart home"][i]}
                  value={h}
                  onChange={(e) => setHighlight(i, e.target.value)}
                />
              ))}
            </div>
          </Section>

          {/* Photos */}
          <Section title="Property photos" subtitle="Up to 4 images">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {form.photos.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border bg-muted group">
                  <img src={src} alt={`Property ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1.5 right-1.5 bg-background/95 hover:bg-destructive hover:text-destructive-foreground rounded-full p-1.5 transition-smooth shadow-soft opacity-0 group-hover:opacity-100"
                    aria-label="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {form.photos.length < 4 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-accent hover:bg-secondary cursor-pointer flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-accent transition-smooth">
                  <Upload className="h-5 w-5" />
                  <span className="text-xs font-medium">Add photo</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handlePhotos(e.target.files)} />
                </label>
              )}
            </div>
          </Section>

          {/* Description */}
          <Section title="Description" subtitle="Notes for the AI to weave in (optional)">
            <Textarea
              placeholder="Spacious 3BR with floor-to-ceiling windows, freshly renovated kitchen, walking distance to subway and parks…"
              rows={4}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </Section>

          {/* Output options */}
          <Section title="Output" subtitle="Choose format and style" last>
            <div className="grid sm:grid-cols-2 gap-4">
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
          </Section>

          <Button variant="hero" size="lg" className="w-full mt-2 h-12 text-base" onClick={handleGenerate} disabled={loading}>
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
        </div>

        {/* Preview */}
        <div className="lg:col-span-2 lg:sticky lg:top-24 self-start">
          <div className="bg-card rounded-2xl border border-border/60 shadow-card p-6 md:p-7">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display text-lg font-bold text-primary tracking-tight">Live preview</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{formatLabels[form.format]}</p>
              </div>
              {resultImage && (
                <Button variant="accent" size="sm" onClick={downloadImage}>
                  <Download className="h-4 w-4" /> Download
                </Button>
              )}
            </div>

            <div className={`${formatAspect[form.format]} w-full rounded-xl overflow-hidden bg-secondary border border-border flex items-center justify-center relative`}>
              {loading && (
                <div className="absolute inset-0 bg-gradient-to-r from-secondary via-background to-secondary bg-[length:200%_100%] animate-shimmer flex flex-col items-center justify-center gap-3 text-primary">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-sm font-semibold">Crafting your ad…</p>
                  <p className="text-xs text-muted-foreground">Usually 10–25 seconds</p>
                </div>
              )}
              {!loading && resultImage && (
                <img src={resultImage} alt="Generated real-estate ad" className="w-full h-full object-cover animate-fade-in" />
              )}
              {!loading && !resultImage && (
                <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground p-8 text-center">
                  <div className="h-14 w-14 rounded-full bg-background flex items-center justify-center border border-border">
                    <ImageIcon className="h-6 w-6 opacity-50" />
                  </div>
                  <p className="text-sm font-medium">Your generated ad will appear here</p>
                  <p className="text-xs text-muted-foreground/80">Fill the form and click Generate</p>
                </div>
              )}
            </div>

            <div className="mt-5 p-4 rounded-xl bg-secondary/60 border border-border/60">
              <p className="text-xs text-muted-foreground leading-relaxed">
                The backend wrapper in <code className="text-primary font-semibold">/backend</code> calls Gemini with your{" "}
                <code className="text-primary font-semibold">GEMINI_API_KEY</code>. Deploy it and set{" "}
                <code className="text-primary font-semibold">VITE_BACKEND_URL</code>.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-primary/70 uppercase tracking-wider">
        {label}
        {required && <span className="text-accent ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function Section({ title, subtitle, children, last }: { title: string; subtitle?: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={last ? "mb-6" : "mb-8 pb-8 border-b border-border/50"}>
      <div className="mb-4">
        <h4 className="text-sm font-bold text-primary tracking-tight">{title}</h4>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
