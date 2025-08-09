
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, Loader2, Image as ImageIcon, FileText, CheckCircle2, CaseSensitive } from 'lucide-react';
import Papa from 'papaparse';
import { TemplatePreview } from '@/components/template-preview';
import { useToast } from "@/hooks/use-toast"

export default function TemplateEditorPage() {
  const { toast } = useToast();
  const [originalHtml, setOriginalHtml] = useState('');
  const [modifiedHtml, setModifiedHtml] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [partnerLogo, setPartnerLogo] = useState<string | null>('https://blog.tycko.cz/wp-content/uploads/2025/08/golf-plan.png');
  const [startListData, setStartListData] = useState<string[][] | null>(null);
  const [mainHeading, setMainHeading] = useState('Týčko tour Golf Park Slapy Svatý Jan');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [partnerLogoFile, setPartnerLogoFile] = useState<File | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const partnerLogoInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/template.html')
      .then(response => response.text())
      .then(data => {
        setOriginalHtml(data);
        setModifiedHtml(data);
      }).catch(error => {
        console.error("Failed to fetch template:", error);
        toast({
          variant: "destructive",
          title: "Chyba",
          description: "Nepodařilo se načíst základní šablonu.",
        });
      });
  }, [toast]);

  const updateTemplate = useCallback(() => {
    if (!originalHtml) return;
    setIsProcessing(true);

    const parser = new DOMParser();
    const doc = parser.parseFromString(originalHtml, 'text/html');
    
    const headingElement = doc.querySelector('h1');
    if (headingElement) {
        headingElement.textContent = mainHeading;
    }

    if (uploadedImage) {
      const imgElement = doc.querySelector('img[alt="Týčko tour Golf Park Slapy Svatý Jan"]');
      if (imgElement) {
        imgElement.setAttribute('src', uploadedImage);
      }
    }
    
    if (partnerLogo) {
      const partnerLogoImg = doc.querySelector('img[alt="Partner logo"]');
      if(partnerLogoImg) {
        partnerLogoImg.setAttribute('src', partnerLogo);
      }
    } else {
        const partnerLogoImg = doc.querySelector('img[alt="Partner logo"]');
        if (partnerLogoImg) {
            const parent = partnerLogoImg.parentNode;
            if(parent) {
                // Also remove the "Partner turnaje" text, which is the previous sibling
                const partnerTextNode = parent.previousSibling;
                if(partnerTextNode && partnerTextNode.nodeType === Node.TEXT_NODE && partnerTextNode.textContent?.trim() === "Partner turnaje") {
                    partnerTextNode.remove();
                }
                parent.remove();
            }
        }
    }

    if (startListData) {
        const thElements = Array.from(doc.querySelectorAll('th'));
        const timeHeader = thElements.find(th => th.textContent?.trim() === 'Čas');
        const table = timeHeader?.closest('table');
        const tbody = table?.querySelector('tbody');

      if (tbody) {
        tbody.innerHTML = '';
        startListData.forEach(rowData => {
          const tr = doc.createElement('tr');
          tr.style.backgroundColor = '#ffffff';

          rowData.forEach((cellData, index) => {
            const td = doc.createElement('td');
            td.style.padding = '8px 6px';
            td.style.border = '1px solid #000000';
            td.style.verticalAlign = 'top';
            td.textContent = cellData;

            if (index < 2) {
              td.style.textAlign = 'center';
              td.style.fontWeight = '600';
              td.style.color = '#268068';
            } else {
              td.style.textAlign = 'left';
            }
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
      }
    }

    const serializer = new XMLSerializer();
    const newHtml = '<!DOCTYPE html>\n' + serializer.serializeToString(doc.documentElement);
    setModifiedHtml(newHtml);
    setIsProcessing(false);
  }, [originalHtml, uploadedImage, startListData, mainHeading, partnerLogo]);

  useEffect(() => {
    updateTemplate();
  }, [uploadedImage, startListData, mainHeading, partnerLogo, updateTemplate]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
            variant: "destructive",
            title: "Chyba",
            description: "Prosím, nahrajte platný obrázkový soubor.",
          });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePartnerLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
            variant: "destructive",
            title: "Chyba",
            description: "Prosím, nahrajte platný obrázkový soubor.",
          });
        return;
      }
      setPartnerLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPartnerLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast({
            variant: "destructive",
            title: "Chyba",
            description: "Prosím, nahrajte platný soubor ve formátu CSV.",
          });
        return;
      }
      setCsvFile(file);
      Papa.parse(file, {
        complete: (results) => {
          const data = results.data as string[][];
          const filteredData = data.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
          setStartListData(filteredData);
        },
        header: false,
        skipEmptyLines: true,
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([modifiedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'startovni-listina-upravena.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
        title: "Staženo",
        description: "Šablona byla úspěšně stažena.",
      });
  };

  return (
    <div className="container mx-auto p-4 md:p-8 bg-background font-body">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-headline font-bold text-primary">Týčko Template Editor</h1>
        <p className="text-muted-foreground mt-2">Jednoduchý nástroj pro úpravu emailové šablony Týčko Tour.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <aside className="lg:col-span-1 flex flex-col gap-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CaseSensitive className="text-primary"/>Hlavní nadpis</CardTitle>
              <CardDescription>Změňte hlavní nadpis v šabloně.</CardDescription>
            </CardHeader>
            <CardContent>
              <Input type="text" value={mainHeading} onChange={(e) => setMainHeading(e.target.value)} />
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ImageIcon className="text-primary"/>Nahrát obrázek turnaje</CardTitle>
              <CardDescription>Vyměňte hlavní obrázek v šabloně.</CardDescription>
            </CardHeader>
            <CardContent>
              <Input type="file" accept="image/*" onChange={handleImageUpload} ref={imageInputRef} className="hidden" id="image-upload" />
              <Button onClick={() => imageInputRef.current?.click()} className="w-full">
                <Upload className="mr-2 h-4 w-4" /> Vybrat obrázek
              </Button>
              {imageFile && <div className="mt-4 text-sm text-muted-foreground flex items-center gap-2 p-2 bg-secondary rounded-md"><CheckCircle2 className="text-green-500"/><span>{imageFile.name}</span></div>}
            </CardContent>
          </Card>
          
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ImageIcon className="text-primary"/>Nahrát logo partnera</CardTitle>
              <CardDescription>Přidejte logo partnera do šablony. Ponechte prázdné pro odstranění.</CardDescription>
            </CardHeader>
            <CardContent>
              <Input type="file" accept="image/*" onChange={handlePartnerLogoUpload} ref={partnerLogoInputRef} className="hidden" id="partner-logo-upload" />
              <Button onClick={() => partnerLogoInputRef.current?.click()} className="w-full">
                <Upload className="mr-2 h-4 w-4" /> Vybrat logo
              </Button>
              {partnerLogoFile && <div className="mt-4 text-sm text-muted-foreground flex items-center gap-2 p-2 bg-secondary rounded-md"><CheckCircle2 className="text-green-500"/><span>{partnerLogoFile.name}</span></div>}
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="text-primary"/>Nahrát startovní listinu</CardTitle>
              <CardDescription>Nahrajte CSV soubor. První řádek (hlavička) bude ignorován.</CardDescription>
            </CardHeader>
            <CardContent>
              <Input type="file" accept=".csv" onChange={handleCsvUpload} ref={csvInputRef} className="hidden" id="csv-upload" />
              <Button onClick={() => csvInputRef.current?.click()} className="w-full">
                <Upload className="mr-2 h-4 w-4" /> Vybrat CSV soubor
              </Button>
               {csvFile && <div className="mt-4 text-sm text-muted-foreground flex items-center gap-2 p-2 bg-secondary rounded-md"><CheckCircle2 className="text-green-500"/><span>{csvFile.name}</span></div>}
            </CardContent>
          </Card>
          
          <Button onClick={handleDownload} size="lg" className="w-full font-bold" disabled={isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Stáhnout upravenou šablonu
          </Button>
        </aside>

        <main className="lg:col-span-2">
            <TemplatePreview htmlContent={modifiedHtml} />
        </main>
      </div>
    </div>
  );
}
