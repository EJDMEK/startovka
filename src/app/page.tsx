"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, Loader2, CaseSensitive, Link as LinkIcon, FileText, CheckCircle2, Image as ImageIcon, Trophy, File as FileIcon } from 'lucide-react';
import Papa from 'papaparse';
import { TemplatePreview } from '@/components/template-preview';
import { useToast } from "@/hooks/use-toast"
import { Switch } from '@/components/ui/switch';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function TemplateEditorPage() {
  const { toast } = useToast();
  const [originalHtml, setOriginalHtml] = useState('');
  const [modifiedHtml, setModifiedHtml] = useState('');
  
  const [tournamentImageUrl, setTournamentImageUrl] = useState<string>('https://blog.tycko.cz/wp-content/uploads/2025/08/IMG-4082-mala-1631794192-medium.jpeg');
  const [partnerLogoUrl, setPartnerLogoUrl] = useState<string>('https://blog.tycko.cz/wp-content/uploads/2025/08/golf-plan.png');
  const [partnerLinkUrl, setPartnerLinkUrl] = useState<string>('https://www.golfplan.cz');
  const [showPartnerSection, setShowPartnerSection] = useState(true);
  const [startListData, setStartListData] = useState<string[][] | null>(null);
  const [mainHeading, setMainHeading] = useState('Týčko tour Golf Park Slapy Svatý Jan');
  
  const [longestDriveText, setLongestDriveText] = useState('6 - Longest drive samostatná');
  const [nearestToPinText, setNearestToPinText] = useState('8 - Nearest to pin společná');

  const [isProcessing, setIsProcessing] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const csvInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);


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

    let currentHtml = originalHtml;
    
    currentHtml = currentHtml.replace(/6 - Longest drive samostatná/g, longestDriveText);
    currentHtml = currentHtml.replace(/8 - Nearest to pin společná/g, nearestToPinText);

    const parser = new DOMParser();
    const doc = parser.parseFromString(currentHtml, 'text/html');
    
    const headingElement = doc.querySelector('h1');
    if (headingElement) {
        headingElement.textContent = mainHeading;
    }

    const tournamentImage = doc.querySelector('img[alt="Týčko tour Golf Park Slapy Svatý Jan"]');
    if (tournamentImage && tournamentImageUrl) {
      tournamentImage.setAttribute('src', tournamentImageUrl);
    }
    
    const partnerP = Array.from(doc.querySelectorAll('p')).find(p => p.textContent?.trim() === 'Partner turnaje');
    if (partnerP) {
        const partnerSectionTd = partnerP.closest('td[align="center"]');
        if (partnerSectionTd) {
            const partnerRow = partnerSectionTd.parentElement;
            if (partnerRow) {
                if (showPartnerSection) {
                    (partnerRow as HTMLElement).style.display = '';
                    const partnerLogoImg = partnerRow.querySelector('img[alt="Partner Logo"]');
                    if (partnerLogoUrl && partnerLogoImg) {
                        partnerLogoImg.setAttribute('src', partnerLogoUrl);

                        let link = partnerLogoImg.parentElement;
                        if (link && link.tagName.toLowerCase() !== 'a') {
                            link = null;
                        }

                        if (partnerLinkUrl) {
                            if (link) {
                                link.setAttribute('href', partnerLinkUrl);
                            } else {
                                const newLink = doc.createElement('a');
                                newLink.setAttribute('href', partnerLinkUrl);
                                newLink.setAttribute('target', '_blank');
                                partnerLogoImg.replaceWith(newLink);
                                newLink.appendChild(partnerLogoImg);
                            }
                        } else {
                            if (link) {
                                (link as HTMLElement).replaceWith(partnerLogoImg);
                            }
                        }
                    }
                } else {
                    (partnerRow as HTMLElement).style.display = 'none';
                }
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
  }, [originalHtml, startListData, mainHeading, tournamentImageUrl, partnerLogoUrl, showPartnerSection, partnerLinkUrl, longestDriveText, nearestToPinText]);

  useEffect(() => {
    const handler = setTimeout(() => {
        updateTemplate();
    }, 500); // Debounce updates
    return () => clearTimeout(handler);
  }, [updateTemplate]);


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

  const handleDownloadPdf = () => {
    if (!iframeRef.current?.contentWindow?.document.body) {
        toast({
            variant: "destructive",
            title: "Chyba",
            description: "Náhled není připraven pro export do PDF.",
        });
        return;
    }

    setIsPdfLoading(true);

    const iframeDoc = iframeRef.current.contentWindow.document;
    const content = iframeDoc.body;

    // A4 width in pixels at 96 DPI is approx 794px. We'll use this for the canvas width.
    const a4WidthPx = 794;
    const originalWidth = content.style.width;
    const container = content.querySelector('table.body') as HTMLElement;
    const originalContainerWidth = container ? container.style.width : '';

    // Temporarily set a fixed width for the content to match A4 proportions
    if (container) {
      container.style.width = `${a4WidthPx}px`;
    } else {
      content.style.width = `${a4WidthPx}px`;
    }

    html2canvas(content, {
        scale: 2,
        useCORS: true, 
        logging: false,
        width: a4WidthPx, // Set canvas width to A4 width
        windowWidth: a4WidthPx,
    }).then(canvas => {
        // Restore original width
        if (container) {
          container.style.width = originalContainerWidth;
        } else {
          content.style.width = originalWidth;
        }

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        
        // Let image width be the full width of the PDF page, and calculate height based on aspect ratio
        const imgWidth = pdfWidth; 
        const imgHeight = imgWidth / ratio;
        
        let heightLeft = imgHeight;
        let position = 0;

        // Add the first page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        // Add new pages if content overflows
        while (heightLeft > 0) {
            position = heightLeft - imgHeight; // Recalculate position for the new page
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        pdf.save('startovni-listina.pdf');
        setIsPdfLoading(false);
        toast({
            title: "Staženo",
            description: "PDF bylo úspěšně staženo.",
          });
    }).catch(err => {
        // Restore original width in case of error
        if (container) {
          container.style.width = originalContainerWidth;
        } else {
          content.style.width = originalWidth;
        }

        console.error("PDF generation error:", err);
        toast({
            variant: "destructive",
            title: "Chyba při generování PDF",
            description: "Nepodařilo se vytvořit PDF soubor. Zkuste to prosím znovu.",
        });
        setIsPdfLoading(false);
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-8 bg-background font-body">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-headline font-bold text-primary">Týčkotour startovní listina editor</h1>
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
              <CardTitle className="flex items-center gap-2"><ImageIcon className="text-primary"/>Odkaz na obrázek turnaje</CardTitle>
              <CardDescription>Vložte odkaz na hlavní obrázek.</CardDescription>
            </CardHeader>
            <CardContent>
               <Input type="url" placeholder="https://..." value={tournamentImageUrl} onChange={(e) => setTournamentImageUrl(e.target.value)} />
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2"><LinkIcon className="text-primary"/>Sekce partnera</CardTitle>
                        <CardDescription>Upravte nebo skryjte sekci partnera.</CardDescription>
                    </div>
                    <Switch
                        checked={showPartnerSection}
                        onCheckedChange={setShowPartnerSection}
                        aria-label="Zobrazit sekci partnera"
                    />
                </div>
            </CardHeader>
            {showPartnerSection && (
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="partner-logo-url">Odkaz na logo partnera</Label>
                        <Input id="partner-logo-url" type="url" placeholder="https://..." value={partnerLogoUrl} onChange={(e) => setPartnerLogoUrl(e.target.value)} />
                    </div>
                     <div>
                        <Label htmlFor="partner-link-url">Odkaz pro proklik loga partnera</Label>
                        <Input id="partner-link-url" type="url" placeholder="https://..." value={partnerLinkUrl} onChange={(e) => setPartnerLinkUrl(e.target.value)} />
                    </div>
                </CardContent>
            )}
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Trophy className="text-primary"/>Vložené soutěže</CardTitle>
              <CardDescription>Upravte texty pro vložené soutěže.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="longest-drive">Longest Drive</Label>
                <Input id="longest-drive" type="text" value={longestDriveText} onChange={(e) => setLongestDriveText(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="nearest-to-pin">Nearest to Pin</Label>
                <Input id="nearest-to-pin" type="text" value={nearestToPinText} onChange={(e) => setNearestToPinText(e.target.value)} />
              </div>
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
          
          <div className="flex flex-col gap-2">
            <Button onClick={handleDownload} size="lg" className="w-full font-bold" disabled={isProcessing || !modifiedHtml}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Stáhnout HTML
            </Button>
            <Button onClick={handleDownloadPdf} size="lg" className="w-full font-bold" variant="outline" disabled={isPdfLoading || !modifiedHtml}>
                {isPdfLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileIcon className="mr-2 h-4 w-4" />}
                Stáhnout PDF
            </Button>
          </div>
        </aside>

        <main className="lg:col-span-2">
            <TemplatePreview htmlContent={modifiedHtml} ref={iframeRef} />
        </main>
      </div>
    </div>
  );
}
