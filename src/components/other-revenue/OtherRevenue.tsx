import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog.tsx";
import Loading from "@/components/Loading.tsx";
import {useRevenues} from "@/hooks/queries";
import {OtherRevenueTable} from "@/components/other-revenue/OtherRevenueTable.tsx";

type Props = {
    open: boolean
    onClose: () => void
}

function OtherRevenue({open, onClose}: Props) {
    const {data: revenues = [], isLoading} = useRevenues()
    if (isLoading) {
        return <Loading/>
    }
    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) onClose()
            }}>
            <DialogContent className="min-w-[90vw] w-[90vw] h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className='text-black! font-bold! text-xl text-center'>Bảng Thu nhập khác</DialogTitle>
                </DialogHeader>
                <OtherRevenueTable revenues={revenues}/>
            </DialogContent>
        </Dialog>
    );
}

export default OtherRevenue;
