"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, Loader2, CaseSensitive, Link as LinkIcon, FileText, CheckCircle2, Image as ImageIcon, Trophy } from 'lucide-react';
import Papa from 'papaparse';
import { TemplatePreview } from '@/components/template-preview';
import { useToast } from "@/hooks/use-toast"
import { Switch } from '@/components/ui/switch';

export default function TemplateEditorPage() {
  const { toast } = useToast();
  const [originalHtml, setOriginalHtml] = useState('');
  const [modifiedHtml, setModifiedHtml] = useState('');
  
  const [tournamentImageUrl, setTournamentImageUrl] = useState<string>('https://blog.tycko.cz/wp-content/uploads/2025/08/IMG-4082-mala-1631794192-medium.jpeg');
  const [partnerLogoUrl, setPartnerLogoUrl] = useState<string>('https://blog.tycko.cz/wp-content/uploads/2025/08/tyckotourpng-scaled.png');
  const [partnerLinkUrl, setPartnerLinkUrl] = useState<string>('https://www.golfplan.cz');
  const [showPartnerSection, setShowPartnerSection] = useState(true);
  const [startListData, setStartListData] = useState<string[][] | null>(null);
  const [mainHeading, setMainHeading] = useState('Týčko tour Golf Park Slapy Svatý Jan');
  
  const [longestDriveText, setLongestDriveText] = useState('6 - Longest drive samostatná');
  const [nearestToPinText, setNearestToPinText] = useState('8 - Nearest to pin společná');

  const [isProcessing, setIsProcessing] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const csvInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);


  useEffect(() => {
    fetch('/template.html')
      .then(response => response.text())
      .then(data => {
        setOriginalHtml(data);
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

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(originalHtml, 'text/html');

        // Main Heading
        const headingElement = doc.querySelector('h1');
        if (headingElement) {
            headingElement.textContent = mainHeading;
        }

        // Tournament Image
        const tournamentImage = doc.querySelector('img[src="https://blog.tycko.cz/wp-content/uploads/2025/08/IMG-4082-mala-1631794192-medium.jpeg"]');
        if (tournamentImage && tournamentImageUrl) {
          tournamentImage.setAttribute('src', tournamentImageUrl);
        }
        
        // Partner Section
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
                            while(link && link.tagName.toLowerCase() !== 'a' && link.parentElement) {
                                link = link.parentElement;
                            }
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
                                if (link && link.parentElement) {
                                    link.parentElement.replaceChild(partnerLogoImg, link);
                                }
                            }
                        }
                    } else {
                        (partnerRow as HTMLElement).style.display = 'none';
                    }
                }
            }
        }
        
        // Add banner under "Těšíme se na Vás"
        const tesimeSeElement = Array.from(doc.querySelectorAll('p, td, span')).find(
            (el) => el.textContent?.trim().includes('Těšíme se na Vás')
        );

        if (tesimeSeElement) {
            const parentRow = tesimeSeElement.closest('tr');
            if (parentRow) {
                const bannerRow = doc.createElement('tr');
                const bannerTd = doc.createElement('td');
                const bannerImg = doc.createElement('img');

                bannerImg.src = 'https://blog.tycko.cz/wp-content/uploads/2025/08/Sablona-APP-BANNER-1.png';
                bannerImg.alt = 'Banner';
                bannerImg.style.width = '100%';
                bannerImg.style.height = 'auto';
                bannerImg.style.display = 'block';
                bannerImg.style.paddingTop = '10px';
                
                bannerTd.appendChild(bannerImg);
                bannerRow.appendChild(bannerTd);

                parentRow.after(bannerRow);
            }
        }
        
        // Start List Data
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
        let newHtml = '<!DOCTYPE html>\n' + serializer.serializeToString(doc.documentElement);

        // Competitions - Replace text directly in the serialized HTML
        newHtml = newHtml.replace('>6 - Longest drive samostatná<', `>${longestDriveText}<`);
        newHtml = newHtml.replace('>8 - Nearest to pin společná<', `>${nearestToPinText}<`);
        
        setModifiedHtml(newHtml);
    } catch (error) {
        console.error("Error updating template:", error);
        toast({
            variant: "destructive",
            title: "Chyba při aktualizaci",
            description: "Došlo k chybě při úpravě šablony.",
        });
    } finally {
        setIsProcessing(false);
    }
  }, [originalHtml, startListData, mainHeading, tournamentImageUrl, partnerLogoUrl, showPartnerSection, partnerLinkUrl, longestDriveText, nearestToPinText, toast]);
  
  useEffect(() => {
    updateTemplate();
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
          </div>
        </aside>

        <main className="lg:col-span-2">
            <TemplatePreview htmlContent={modifiedHtml} ref={iframeRef} />
        </main>
      </div>
    </div>
  );
}
