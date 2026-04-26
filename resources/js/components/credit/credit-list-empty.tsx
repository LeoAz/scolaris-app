import { Search } from 'lucide-react';
import { memo } from 'react';

export const CreditListEmpty = memo(() => (
    <div className="py-12 text-center">
        <div className="mx-auto mb-3 w-fit rounded-full bg-muted/50 p-3">
            <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">
                Aucun dossier trouvé
            </h3>
            <p className="text-xs text-muted-foreground">
                Aucun résultat pour les filtres sélectionnés.
            </p>
        </div>
    </div>
));

CreditListEmpty.displayName = 'CreditListEmpty';
