// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract P2PLending {
    enum LoanStatus { Requested, Funded, Repaid, Defaulted, Removed }

    struct Loan {
        uint id;
        address borrower;
        address lender;
        uint amount; // Principal amount in ETH (stored as ETH, not wei)
        uint interestRate; // Annual interest rate in percentage (4 = 4%)
        uint duration; // Duration in months
        uint startTime;
        LoanStatus status;
        uint installmentsPaid;
        uint lastPaidTimestamp;
        uint monthlyPayment; // Monthly payment amount in ETH
        uint totalAmountDue; // Total amount to be repaid in ETH
    }

    uint public loanCounter = 0;
    mapping(uint => Loan) public loans;
    mapping(address => uint) public creditScores;

    event LoanRequested(uint loanId, address borrower, uint amount, uint interestRate, uint duration);
    event LoanFunded(uint loanId, address lender, uint amount);
    event InstallmentPaid(uint loanId, uint installmentNo, address borrower, uint amount);
    event LoanRepaid(uint loanId);
    event LoanRemoved(uint loanId, address borrower);
    event LatePayment(uint loanId, uint timestamp);

    modifier onlyBorrower(uint loanId) {
        require(msg.sender == loans[loanId].borrower, "Not borrower");
        _;
    }

    modifier onlyLender(uint loanId) {
        require(msg.sender == loans[loanId].lender, "Not lender");
        _;
    }

    function requestLoan(uint _amount, uint _interestRate, uint _durationMonths) external {
        require(_amount > 0, "Amount must be greater than 0");
        require(_interestRate <= 100, "Interest rate too high"); // Max 100%
        require(_durationMonths > 0 && _durationMonths <= 60, "Invalid duration");

        loanCounter++;
        
        // FIXED: Calculate monthly payment and total amount due using simple interest
        // Formula: Total = Principal + (Principal * Rate * Time)
        // Where Rate is annual rate / 100, Time is months / 12
        uint totalInterest = (_amount * _interestRate * _durationMonths) / (100 * 12);
        uint totalAmountDue = _amount + totalInterest;
        uint monthlyPayment = totalAmountDue / _durationMonths;

        loans[loanCounter] = Loan({
            id: loanCounter,
            borrower: msg.sender,
            lender: address(0),
            amount: _amount,
            interestRate: _interestRate,
            duration: _durationMonths,
            startTime: 0,
            status: LoanStatus.Requested,
            installmentsPaid: 0,
            lastPaidTimestamp: 0,
            monthlyPayment: monthlyPayment,
            totalAmountDue: totalAmountDue
        });

        emit LoanRequested(loanCounter, msg.sender, _amount, _interestRate, _durationMonths);
    }

    function fundLoan(uint _loanId) external payable {
        require(_loanId > 0 && _loanId <= loanCounter, "Invalid loan ID");
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Requested, "Loan not available for funding");

        // Convert ETH to wei for comparison with msg.value
        uint requiredWei = loan.amount * 1 ether;
        require(msg.value == requiredWei, "Must send exact loan amount in ETH");

        loan.lender = msg.sender;
        loan.status = LoanStatus.Funded;
        loan.startTime = block.timestamp;
        loan.lastPaidTimestamp = block.timestamp;

        payable(loan.borrower).transfer(msg.value);

        emit LoanFunded(_loanId, msg.sender, loan.amount);
    }

    function payInstallment(uint _loanId) external payable onlyBorrower(_loanId) {
        require(_loanId > 0 && _loanId <= loanCounter, "Invalid loan ID");
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Funded, "Loan not active");
        require(loan.installmentsPaid < loan.duration, "All installments already paid");
        
        uint installmentNo = loan.installmentsPaid + 1;
        uint expectedPayment = loan.monthlyPayment;
        
        // For the last installment, pay the remaining amount to handle rounding
        if (installmentNo == loan.duration) {
            uint totalPaid = loan.monthlyPayment * (loan.installmentsPaid);
            expectedPayment = loan.totalAmountDue - totalPaid;
        }
        
        // Convert ETH to wei for comparison with msg.value
        uint requiredWei = expectedPayment * 1 ether;
        require(msg.value >= requiredWei, "Insufficient payment amount");

        // Check if payment is late
        uint expectedDueDate = loan.startTime + (installmentNo * 30 days);
        if (block.timestamp > expectedDueDate) {
            creditScores[loan.borrower] = creditScores[loan.borrower] > 5
                ? creditScores[loan.borrower] - 5
                : 0;
            emit LatePayment(_loanId, block.timestamp);
        } else {
            creditScores[loan.borrower] += 2;
        }

        loan.installmentsPaid++;
        loan.lastPaidTimestamp = block.timestamp;

        // Transfer payment to lender
        payable(loan.lender).transfer(msg.value);

        emit InstallmentPaid(_loanId, installmentNo, msg.sender, expectedPayment);

        // Mark fully repaid
        if (loan.installmentsPaid == loan.duration) {
            loan.status = LoanStatus.Repaid;
            emit LoanRepaid(_loanId);
        }
    }

    function defaultLoan(uint _loanId) external onlyLender(_loanId) {
        require(_loanId > 0 && _loanId <= loanCounter, "Invalid loan ID");
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Funded, "Loan not active");
        
        uint installmentNo = loan.installmentsPaid + 1;
        uint expectedDueDate = loan.startTime + (installmentNo * 30 days);
        require(block.timestamp > expectedDueDate + 30 days, "Payment not overdue by 30 days");
        
        loan.status = LoanStatus.Defaulted;
        
        // Severely penalize borrower's credit score
        creditScores[loan.borrower] = 0;
    }

    function removeLoan(uint _loanId) external onlyBorrower(_loanId) {
        require(_loanId > 0 && _loanId <= loanCounter, "Invalid loan ID");
        require(loans[_loanId].status == LoanStatus.Requested, "Cannot remove funded/repaid loan");
        loans[_loanId].status = LoanStatus.Removed;
        emit LoanRemoved(_loanId, msg.sender);
    }

    function getLoan(uint _loanId) external view returns (
        uint id,
        address borrower,
        address lender,
        uint amount,
        uint interestRate,
        uint duration,
        uint startTime,
        LoanStatus status,
        uint installmentsPaid,
        uint lastPaidTimestamp,
        uint monthlyPayment,
        uint totalAmountDue
    ) {
        require(_loanId > 0 && _loanId <= loanCounter, "Invalid loan ID");
        Loan memory loan = loans[_loanId];
        return (
            loan.id,
            loan.borrower,
            loan.lender,
            loan.amount,
            loan.interestRate,
            loan.duration,
            loan.startTime,
            loan.status,
            loan.installmentsPaid,
            loan.lastPaidTimestamp,
            loan.monthlyPayment,
            loan.totalAmountDue
        );
    }

    function getAllLoans() external view returns (Loan[] memory) {
        Loan[] memory result = new Loan[](loanCounter);
        for (uint i = 1; i <= loanCounter; i++) {
            result[i - 1] = loans[i];
        }
        return result;
    }

    function getAvailableLoans() external view returns (Loan[] memory) {
        uint availableCount = 0;
        
        // Count available loans
        for (uint i = 1; i <= loanCounter; i++) {
            if (loans[i].status == LoanStatus.Requested && loans[i].amount > 0) {
                availableCount++;
            }
        }
        
        // Create array with available loans
        Loan[] memory availableLoans = new Loan[](availableCount);
        uint index = 0;
        
        for (uint i = 1; i <= loanCounter; i++) {
            if (loans[i].status == LoanStatus.Requested && loans[i].amount > 0) {
                availableLoans[index] = loans[i];
                index++;
            }
        }
        
        return availableLoans;
    }

    function getCreditScore(address user) public view returns (uint) {
        return creditScores[user];
    }

    function getNextPaymentDue(uint _loanId) external view returns (uint dueDate, uint amount) {
        require(_loanId > 0 && _loanId <= loanCounter, "Invalid loan ID");
        Loan memory loan = loans[_loanId];
        require(loan.status == LoanStatus.Funded, "Loan not active");
        require(loan.installmentsPaid < loan.duration, "All installments paid");
        
        uint installmentNo = loan.installmentsPaid + 1;
        dueDate = loan.startTime + (installmentNo * 30 days);
        
        // For the last installment, calculate remaining amount
        if (installmentNo == loan.duration) {
            uint totalPaid = loan.monthlyPayment * loan.installmentsPaid;
            amount = loan.totalAmountDue - totalPaid;
        } else {
            amount = loan.monthlyPayment;
        }
    }

    function isPaymentOverdue(uint _loanId) external view returns (bool) {
        require(_loanId > 0 && _loanId <= loanCounter, "Invalid loan ID");
        Loan memory loan = loans[_loanId];
        if (loan.status != LoanStatus.Funded || loan.installmentsPaid >= loan.duration) {
            return false;
        }
        
        uint installmentNo = loan.installmentsPaid + 1;
        uint expectedDueDate = loan.startTime + (installmentNo * 30 days);
        return block.timestamp > expectedDueDate;
    }

    // Helper function to check if loan exists
    function loanExists(uint _loanId) external view returns (bool) {
        return _loanId > 0 && _loanId <= loanCounter && loans[_loanId].borrower != address(0);
    }

    // Get loan count
    function getLoanCount() external view returns (uint) {
        return loanCounter;
    }

    // Get borrower's loans
    function getBorrowerLoans(address _borrower) external view returns (Loan[] memory) {
        uint borrowerLoanCount = 0;
        
        // Count borrower's loans
        for (uint i = 1; i <= loanCounter; i++) {
            if (loans[i].borrower == _borrower) {
                borrowerLoanCount++;
            }
        }
        
        // Create array with borrower's loans
        Loan[] memory borrowerLoans = new Loan[](borrowerLoanCount);
        uint index = 0;
        
        for (uint i = 1; i <= loanCounter; i++) {
            if (loans[i].borrower == _borrower) {
                borrowerLoans[index] = loans[i];
                index++;
            }
        }
        
        return borrowerLoans;
    }

    // Get lender's loans
    function getLenderLoans(address _lender) external view returns (Loan[] memory) {
        uint lenderLoanCount = 0;
        
        // Count lender's loans
        for (uint i = 1; i <= loanCounter; i++) {
            if (loans[i].lender == _lender) {
                lenderLoanCount++;
            }
        }
        
        // Create array with lender's loans
        Loan[] memory lenderLoans = new Loan[](lenderLoanCount);
        uint index = 0;
        
        for (uint i = 1; i <= loanCounter; i++) {
            if (loans[i].lender == _lender) {
                lenderLoans[index] = loans[i];
                index++;
            }
        }
        
        return lenderLoans;
    }

    // ADDED: Helper function to preview loan calculations before submitting
    function previewLoanCalculation(uint _amount, uint _interestRate, uint _durationMonths) 
        external 
        pure 
        returns (uint monthlyPayment, uint totalAmountDue, uint totalInterest) 
    {
        require(_amount > 0, "Amount must be greater than 0");
        require(_interestRate <= 100, "Interest rate too high");
        require(_durationMonths > 0 && _durationMonths <= 60, "Invalid duration");
        
        totalInterest = (_amount * _interestRate * _durationMonths) / (100 * 12);
        totalAmountDue = _amount + totalInterest;
        monthlyPayment = totalAmountDue / _durationMonths;
        
        return (monthlyPayment, totalAmountDue, totalInterest);
    }
}