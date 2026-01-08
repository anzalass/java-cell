-- AddForeignKey
ALTER TABLE "ItemsTransaksiVoucherDownline" ADD CONSTRAINT "ItemsTransaksiVoucherDownline_idVoucher_fkey" FOREIGN KEY ("idVoucher") REFERENCES "Voucher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
